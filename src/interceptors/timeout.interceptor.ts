import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
  UseInterceptors,
} from '@nestjs/common';
import {
  catchError,
  Observable,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';

export const Timeout = (timeoutInMilliseconds: number = 30000) => {
  // Default timeout duration set to 30 seconds
  return UseInterceptors(new TimeoutInterceptor(timeoutInMilliseconds));
};

@Injectable()
class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly timeoutInMilliseconds: number) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      timeout(this.timeoutInMilliseconds), // Set the timeout duration

      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }

        return throwError(() => err);
      }),
    );
  }
}
