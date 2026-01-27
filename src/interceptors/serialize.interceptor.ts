import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { ClassConstructor } from 'class-transformer';
import { map, Observable } from 'rxjs';

export const Serialize = <T, V>(dto: ClassConstructor<V>) => {
  return UseInterceptors(new SerializeInterceptor<T, V>(dto));
};

@Injectable()
class SerializeInterceptor<T, V> implements NestInterceptor<T, V> {
  constructor(private readonly dto: ClassConstructor<V>) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<V> {
    return next.handle().pipe(
      map((data: T) => {
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
