-- CreateTable
CREATE TABLE "DemoTransaction" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Equipment',
    "invoiceName" TEXT,
    "invoicePath" TEXT,

    CONSTRAINT "DemoTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoApproval" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "stage" "ApprovalStage" NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoApproval_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DemoApproval" ADD CONSTRAINT "DemoApproval_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "DemoTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

