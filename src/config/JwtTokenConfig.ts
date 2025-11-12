export class JwtTokenConfig {

  // SECRET KEY

  public static readonly secretKey: string = process.env.JWT_SECRET || '000{%%ANEVIDEÑO%%}000';

  // EXPIRATION TIME (NULL = NO EXPIRATION)
  // public static readonly expiresIn: string | null = null;

  // OTHER OPTIONS

  public static readonly issuer: string = process.env.JWT_ISSUER || 'cpn-anevi';
  public static readonly audience: string = process.env.JWT_AUDIENCE || 'cpn-anevi-user';

}
