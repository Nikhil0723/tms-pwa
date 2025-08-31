// PDF and HTML generation utilities for invoices

export interface InvoiceData {
  student: any
  payments: any[]
  settings: any
  invoiceNumber: string
  invoiceDate: string
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const { student, payments, settings, invoiceNumber, invoiceDate } = data

  // Calculate totals
  const totalFees = student.assignedFees.reduce((sum: number, fee: any) => sum + fee.amount, 0)
  const studentPayments = payments.filter((p: any) => p.studentId === student.id)
  const totalPaid = studentPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
  const outstanding = totalFees - totalPaid

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || "USD"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 40px;
          border-bottom: 2px solid #eee;
          padding-bottom: 20px;
        }
        .school-info h1 {
          margin: 0;
          color: #2563eb;
          font-size: 28px;
        }
        .school-info p {
          margin: 5px 0;
          color: #666;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-info h2 {
          margin: 0;
          font-size: 24px;
          color: #dc2626;
        }
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .student-info, .invoice-meta {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
        }
        .student-info h3, .invoice-meta h3 {
          margin-top: 0;
          color: #1e40af;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 10px;
        }
        .fees-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .fees-table th,
        .fees-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        .fees-table th {
          background: #f1f5f9;
          font-weight: 600;
          color: #475569;
        }
        .fees-table tr:hover {
          background: #f8fafc;
        }
        .summary {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .summary-row.total {
          font-weight: bold;
          font-size: 18px;
          border-top: 2px solid #e2e8f0;
          padding-top: 10px;
          margin-top: 15px;
        }
        .outstanding {
          color: #dc2626;
        }
        .paid {
          color: #059669;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .header { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-info">
          <h1>${settings?.schoolName || "School Name"}</h1>
          <p>${settings?.address || "School Address"}</p>
          <p>Phone: ${settings?.phone || "N/A"} | Email: ${settings?.email || "N/A"}</p>
        </div>
        <div class="invoice-info">
          <h2>INVOICE</h2>
          <p><strong>${invoiceNumber}</strong></p>
        </div>
      </div>

      <div class="invoice-details">
        <div class="student-info">
          <h3>Bill To:</h3>
          <p><strong>${student.firstName} ${student.lastName}</strong></p>
          <p>Student ID: ${student.studentId}</p>
          <p>Grade: ${student.grade}</p>
          <p>Email: ${student.email || "N/A"}</p>
          <p>Phone: ${student.phone || "N/A"}</p>
        </div>
        <div class="invoice-meta">
          <h3>Invoice Details:</h3>
          <p><strong>Invoice Date:</strong> ${formatDate(invoiceDate)}</p>
          <p><strong>Academic Year:</strong> ${settings?.academicYear || new Date().getFullYear()}</p>
          <p><strong>Due Date:</strong> ${formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}</p>
        </div>
      </div>

      <table class="fees-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Category</th>
            <th>Due Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${student.assignedFees
            .map(
              (fee: any) => `
            <tr>
              <td>${fee.name}</td>
              <td>${fee.category}</td>
              <td>${formatDate(fee.dueDate)}</td>
              <td>${formatCurrency(fee.amount)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row">
          <span>Total Fees:</span>
          <span>${formatCurrency(totalFees)}</span>
        </div>
        <div class="summary-row paid">
          <span>Total Paid:</span>
          <span>${formatCurrency(totalPaid)}</span>
        </div>
        <div class="summary-row total ${outstanding > 0 ? "outstanding" : "paid"}">
          <span>Outstanding Balance:</span>
          <span>${formatCurrency(outstanding)}</span>
        </div>
      </div>

      ${
        studentPayments.length > 0
          ? `
        <div style="margin-top: 30px;">
          <h3>Payment History:</h3>
          <table class="fees-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${studentPayments
                .map(
                  (payment: any) => `
                <tr>
                  <td>${formatDate(payment.date)}</td>
                  <td>${payment.method}</td>
                  <td>${payment.reference || "N/A"}</td>
                  <td class="paid">${formatCurrency(payment.amount)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
          : ""
      }

      <div class="footer">
        <p>Thank you for your payment. Please contact us if you have any questions about this invoice.</p>
        <p>Generated on ${formatDate(new Date().toISOString())}</p>
      </div>
    </body>
    </html>
  `
}

export async function generatePDF(htmlContent: string, filename: string): Promise<void> {
  try {
    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)

    // Create a temporary link element for download
    const link = document.createElement("a")
    link.href = url
    link.download = filename.replace(".pdf", ".html") // Download as HTML since we can't generate PDF client-side
    link.style.display = "none"

    // Add to DOM, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(url), 100)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Unable to generate PDF. Please try downloading as HTML instead.")
  }
}

export function downloadHTML(htmlContent: string, filename: string): void {
  try {
    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)

    // Create a temporary link element for download
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.style.display = "none"

    // Add to DOM, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(url), 100)
  } catch (error) {
    console.error("Error downloading HTML:", error)
    throw new Error("Unable to download HTML file.")
  }
}

export function printInvoice(htmlContent: string): void {
  try {
    // Create a new window for printing (this should work better than popup)
    const printWindow = window.open("", "_blank", "width=800,height=600")

    if (!printWindow) {
      // Fallback: create a hidden iframe for printing
      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      document.body.appendChild(iframe)

      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(htmlContent)
        doc.close()

        // Wait for content to load then print
        setTimeout(() => {
          iframe.contentWindow?.print()
          setTimeout(() => document.body.removeChild(iframe), 1000)
        }, 500)
      }
    } else {
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  } catch (error) {
    console.error("Error printing invoice:", error)
    throw new Error("Unable to print invoice. Please try downloading instead.")
  }
}
