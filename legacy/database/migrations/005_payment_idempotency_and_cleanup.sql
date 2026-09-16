-- Final payment idempotency hardening
DELETE p1 FROM payment_intents p1
JOIN payment_intents p2
  ON p1.razorpay_order_id = p2.razorpay_order_id
 AND p1.id > p2.id
WHERE p1.razorpay_order_id IS NOT NULL AND p1.razorpay_order_id <> '';

DELETE e1 FROM enrollments e1
JOIN enrollments e2
  ON e1.razorpay_order_id = e2.razorpay_order_id
 AND e1.id > e2.id
WHERE e1.razorpay_order_id IS NOT NULL AND e1.razorpay_order_id <> '';

DELETE pay1 FROM payments pay1
JOIN payments pay2
  ON pay1.razorpay_payment_id = pay2.razorpay_payment_id
 AND pay1.id > pay2.id
WHERE pay1.razorpay_payment_id IS NOT NULL AND pay1.razorpay_payment_id <> '';

ALTER TABLE payment_intents
  ADD UNIQUE KEY uq_payment_intent_order (razorpay_order_id);

ALTER TABLE enrollments
  ADD UNIQUE KEY uq_enrollment_razorpay_order (razorpay_order_id);

ALTER TABLE payments
  ADD UNIQUE KEY uq_payment_razorpay_payment (razorpay_payment_id);
