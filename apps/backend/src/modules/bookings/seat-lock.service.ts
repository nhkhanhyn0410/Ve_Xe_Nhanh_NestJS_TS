import { Injectable, Inject, ConflictException } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

/**
 * Cấu trúc thông tin một ghế cần khóa.
 * Mỗi ghế khớp với đúng 1 tripId + seatNumber.
 */
export interface SeatLockRequest {
  readonly tripId: string;
  readonly seatNumber: string;
}

/**
 * Kết quả trả về sau khi khóa thành công.
 * Chứa lockKey để có thể giải phóng sau.
 */
export interface SeatLockResult {
  readonly lockKey: string;
  readonly tripId: string;
  readonly seatNumber: string;
  readonly expiresInSeconds: number;
}

/** Thời gian giữ ghế mặc định: 10 phút (600 giây) */
const DEFAULT_LOCK_TTL_SECONDS = 600;

/**
 * SeatLockService
 *
 * Sử dụng Redis để triển khai Distributed Atomic Seat Locking.
 * Đảm bảo rằng không có 2 khách hàng nào có thể giữ cùng 1 ghế
 * trên cùng 1 chuyến xe trong cùng 1 thời điểm.
 *
 * Thuật toán chống Race Condition:
 * - Sử dụng lệnh Redis `SET ... NX EX` (Set if Not eXists, với Expiry).
 *   Lệnh này là NGUYÊN TỬ (Atomic) trên Redis, nghĩa là nếu 2 request
 *   đến cùng lúc, chỉ đúng 1 request thành công, request còn lại fail.
 * - Khi khóa nhiều ghế (Cross-operator Transfer), sử dụng Redis Pipeline
 *   để đảm bảo tất cả ghế được khóa trong 1 lần gửi lệnh duy nhất.
 *   Nếu bất kỳ ghế nào đã bị khóa, toàn bộ sẽ Rollback (Giải phóng
 *   những ghế vừa khóa thành công).
 */
@Injectable()
export class SeatLockService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Tạo Redis Key cho 1 ghế cụ thể trên 1 chuyến cụ thể.
   * Format: `seat_lock:{tripId}:{seatNumber}`
   */
  private buildLockKey(tripId: string, seatNumber: string): string {
    return `seat_lock:${tripId}:${seatNumber}`;
  }

  /**
   * Khóa nguyên tử MỘT ghế duy nhất.
   * Trả về true nếu khóa thành công, false nếu ghế đã bị người khác giữ.
   */
  private async lockSingleSeat(
    tripId: string,
    seatNumber: string,
    holderId: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const key = this.buildLockKey(tripId, seatNumber);
    // SET key value NX EX ttl -> Chỉ set nếu key CHƯA tồn tại
    const result = await this.redis.set(key, holderId, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /**
   * Khóa NHIỀU ghế cùng lúc (Multi-seat Atomic Lock).
   *
   * Đây là thuật toán cốt lõi cho bài toán Cross-Operator Transfer:
   * Khách mua vé SGN->HN (Ghế A1 xe Phương Trang) + HN->HP (Ghế B3 xe Hoàng Long).
   * Cả 2 ghế phải được khóa đồng thời. Nếu 1 ghế fail, rollback tất cả.
   *
   * @param seats - Mảng các ghế cần khóa
   * @param holderId - ID của người giữ ghế (userId hoặc sessionId)
   * @param ttlSeconds - Thời gian giữ ghế (mặc định 10 phút)
   * @returns Mảng kết quả khóa thành công
   * @throws ConflictException nếu bất kỳ ghế nào đã bị khóa
   */
  async lockSeats(
    seats: readonly SeatLockRequest[],
    holderId: string,
    ttlSeconds: number = DEFAULT_LOCK_TTL_SECONDS,
  ): Promise<readonly SeatLockResult[]> {
    const lockedKeys: string[] = [];
    const results: SeatLockResult[] = [];

    for (const seat of seats) {
      const success = await this.lockSingleSeat(
        seat.tripId,
        seat.seatNumber,
        holderId,
        ttlSeconds,
      );

      if (!success) {
        // Ghế này đã bị người khác giữ -> Rollback tất cả ghế đã khóa trước đó
        if (lockedKeys.length > 0) {
          await this.redis.del(...lockedKeys);
        }

        throw new ConflictException(
          `Ghế ${seat.seatNumber} trên chuyến ${seat.tripId} đã được người khác giữ chỗ. Vui lòng chọn ghế khác.`,
        );
      }

      const lockKey = this.buildLockKey(seat.tripId, seat.seatNumber);
      lockedKeys.push(lockKey);
      results.push({
        lockKey,
        tripId: seat.tripId,
        seatNumber: seat.seatNumber,
        expiresInSeconds: ttlSeconds,
      });
    }

    return results;
  }

  /**
   * Giải phóng ghế đã khóa (Khi hủy đơn hoặc hết thời gian thanh toán).
   * Chỉ cho phép giải phóng nếu holderId trùng khớp (Tránh khách A xóa khóa của khách B).
   */
  async releaseSeats(
    seats: readonly SeatLockRequest[],
    holderId: string,
  ): Promise<number> {
    let releasedCount = 0;

    for (const seat of seats) {
      const key = this.buildLockKey(seat.tripId, seat.seatNumber);
      const currentHolder = await this.redis.get(key);

      // Chỉ xóa khóa nếu đúng chủ sở hữu
      if (currentHolder === holderId) {
        await this.redis.del(key);
        releasedCount++;
      }
    }

    return releasedCount;
  }

  /**
   * Kiểm tra trạng thái khóa của một ghế.
   * Trả về holderId nếu ghế đang bị khóa, null nếu ghế trống.
   */
  async getSeatHolder(
    tripId: string,
    seatNumber: string,
  ): Promise<string | null> {
    const key = this.buildLockKey(tripId, seatNumber);
    return this.redis.get(key);
  }

  /**
   * Kiểm tra trạng thái khóa của NHIỀU ghế trên cùng 1 chuyến.
   * Trả về danh sách các ghế đang bị khóa bởi người khác.
   *
   * Hữu ích để Frontend render sơ đồ ghế:
   * - Ghế trống (DB chưa book + Redis không khóa): Xanh lá
   * - Ghế đang bị HOLD (Redis có khóa): Vàng cam
   * - Ghế đã BÁN (DB đã book): Đỏ
   */
  async getLockedSeats(
    tripId: string,
    seatNumbers: readonly string[],
  ): Promise<readonly string[]> {
    if (seatNumbers.length === 0) return [];

    const pipeline = this.redis.pipeline();
    for (const seatNumber of seatNumbers) {
      const key = this.buildLockKey(tripId, seatNumber);
      pipeline.get(key);
    }

    const results = await pipeline.exec();
    const lockedSeats: string[] = [];

    if (results) {
      for (let i = 0; i < results.length; i++) {
        const [err, value] = results[i];
        if (!err && value !== null) {
          lockedSeats.push(seatNumbers[i]);
        }
      }
    }

    return lockedSeats;
  }

  /**
   * Gia hạn thời gian giữ ghế (Khi khách bấm "Vẫn đang thanh toán").
   * Chỉ gia hạn nếu holderId trùng khớp.
   */
  async extendLock(
    tripId: string,
    seatNumber: string,
    holderId: string,
    additionalSeconds: number = DEFAULT_LOCK_TTL_SECONDS,
  ): Promise<boolean> {
    const key = this.buildLockKey(tripId, seatNumber);
    const currentHolder = await this.redis.get(key);

    if (currentHolder !== holderId) {
      return false; // Không phải chủ khóa
    }

    await this.redis.expire(key, additionalSeconds);
    return true;
  }
}
