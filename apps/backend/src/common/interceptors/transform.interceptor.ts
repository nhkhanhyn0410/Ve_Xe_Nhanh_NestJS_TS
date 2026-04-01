import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface TransformedResponse<T> {
  success: true;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  TextDecoderStream,
  TransformedResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data as TransformedResponse<T>;
        }
        return {
          success: true as const,
          data: data as T,
        };
      }),
    );
  }
}
