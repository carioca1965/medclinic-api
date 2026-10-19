import jwt, { SignOptions } from "jsonwebtoken";
import { TokenPayload, TokenService } from "./token-service";

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: this.expiresIn as SignOptions["expiresIn"],
    };
    return jwt.sign({ userId: payload.userId, roles: payload.roles }, this.secret, options);
  }

  verify(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload;
    return { userId: decoded.userId as number, roles: decoded.roles as TokenPayload["roles"] };
  }
}
