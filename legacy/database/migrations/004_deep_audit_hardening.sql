-- Deep audit hardening: payment/coupon binding and contact schema alignment
ALTER TABLE payment_intents ADD COLUMN coupon_redeemed_at DATETIME NULL;
ALTER TABLE contact_messages ADD COLUMN phone VARCHAR(30) NULL;
