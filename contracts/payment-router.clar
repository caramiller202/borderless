;; Payment Router Contract - Borderless
;; Enables cross-border payments with multi-currency support and compliance logic

;; Author: Borderless Protocol

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; DATA STRUCTURES AND CONSTANTS
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-data-var admin principal tx-sender)

(define-map user-balances { user: principal, token: (buff 32) } uint)
(define-map supported-tokens (buff 32) bool)
(define-map payment-records uint {
  sender: principal,
  recipient: principal,
  amount: uint,
  token: (buff 32),
  status: (string-ascii 20),
  timestamp: uint
})

(define-data-var payment-id-counter uint u0)

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-TOKEN u101)
(define-constant ERR-INSUFFICIENT-BALANCE u102)
(define-constant ERR-NOT-FOUND u103)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; HELPERS
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-private (is-admin (sender principal))
  (is-eq sender (var-get admin)))

(define-private (token-supported (token (buff 32)))
  (default-to false (map-get? supported-tokens token)))

(define-private (generate-payment-id)
  (let ((id (var-get payment-id-counter)))
    (begin
      (var-set payment-id-counter (+ id u1))
      id)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; ADMIN FUNCTIONS
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-public (add-supported-token (token (buff 32)))
  (begin
    (asserts! (is-admin tx-sender) (err ERR-NOT-AUTHORIZED))
    (ok (map-set supported-tokens token true))))

(define-public (remove-supported-token (token (buff 32)))
  (begin
    (asserts! (is-admin tx-sender) (err ERR-NOT-AUTHORIZED))
    (ok (map-delete supported-tokens token))))

(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin tx-sender) (err ERR-NOT-AUTHORIZED))
    (var-set admin new-admin)
    (ok true)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; PAYMENT FUNCTIONS
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-public (deposit (amount uint) (token (buff 32)))
  (begin
    (asserts! (token-supported token) (err ERR-INVALID-TOKEN))
    (let ((key { user: tx-sender, token: token }))
      (map-set user-balances key (+ amount (default-to u0 (map-get? user-balances key))))
      (ok true))))

(define-public (initiate-payment (recipient principal) (amount uint) (token (buff 32)))
  (begin
    (asserts! (token-supported token) (err ERR-INVALID-TOKEN))
    (let (
      (key { user: tx-sender, token: token })
      (balance (default-to u0 (map-get? user-balances key))))
      (asserts! (>= balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set user-balances key (- balance amount))
      (let ((rec-key { user: recipient, token: token }))
        (map-set user-balances rec-key (+ amount (default-to u0 (map-get? user-balances rec-key)))))
      (let ((payment-id (generate-payment-id)))
        (map-set payment-records payment-id {
          sender: tx-sender,
          recipient: recipient,
          amount: amount,
          token: token,
          status: "completed",
          timestamp: block-height
        })
        (ok payment-id)))))

(define-read-only (get-balance (user principal) (token (buff 32)))
  (default-to u0 (map-get? user-balances { user: user, token: token })))

(define-read-only (get-payment (id uint))
  (match (map-get? payment-records id)
    some-payment (ok some-payment)
    none (err ERR-NOT-FOUND)))
