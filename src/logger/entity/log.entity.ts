import { IsOptional } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'logs' })
export class LogsEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @IsOptional()
  @Column({ nullable: true })
  public host: string;

  @IsOptional()
  @Column({ nullable: true })
  public url: string;

  @IsOptional()
  @Column({ nullable: true })
  public statusCode: number;

  @IsOptional()
  @Column({ nullable: true })
  public method: string;

  @IsOptional()
  @Column({ nullable: true })
  public user: string;

  @IsOptional()
  @Column()
  public context: string;

  @IsOptional()
  @Column()
  public message: string;

  @IsOptional()
  @Column()
  public level: string;

  @CreateDateColumn({ type: 'timestamptz' })
  public createdAt: string;
}
