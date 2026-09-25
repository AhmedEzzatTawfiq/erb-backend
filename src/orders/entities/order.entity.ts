import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { Customer } from "../../customers/entities/customer.entity";
import { OrderStatus } from "../enums/order-status.enum";
import { OrderLine } from "./order-line.entity";
import { PrimaryGeneratedColumn } from "typeorm";
import { Invoice } from "src/invoices/entities/invoice.entity";

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({
    type: 'date',
  })
  orderDate: Date;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column()
  paymentMethod: string;

  @Column()
  shippingAddress: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @OneToMany(() => OrderLine, (line) => line.order)
  lines: OrderLine[];

  @OneToOne(
    () => Invoice,
    (Invoice) => Invoice.order,
  )
  invoice: Invoice;
}
