// @ts-ignore - SendGrid module
const sgMail = require('@sendgrid/mail');

// Email service setup
let isInitialized = false;

function initializeEmailService() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY not found. Email functionality will be disabled.");
    return false;
  }
  
  if (!isInitialized) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    isInitialized = true;
  }
  
  return true;
}

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  const isConfigured = initializeEmailService();
  
  if (!isConfigured) {
    throw new Error("Email service not configured. Please set SENDGRID_API_KEY environment variable.");
  }

  try {
    const emailData = {
      to: params.to,
      from: params.from || 'noreply@revalsys.com', // Default from email
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments || []
    };

    await sgMail.send(emailData);
    console.log(`Email sent successfully to: ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    throw new Error(`Failed to send email: ${error}`);
  }
}

export function generateReportHTML(reportData: any): string {
  const { summaryStats, estimations, generatedAt } = reportData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Estimation Report</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 30px; 
          border-radius: 10px; 
          text-align: center; 
          margin-bottom: 30px; 
        }
        .summary { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 20px; 
          margin-bottom: 30px; 
        }
        .stat-card { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          border-left: 4px solid #667eea; 
          text-align: center; 
        }
        .stat-value { 
          font-size: 2em; 
          font-weight: bold; 
          color: #667eea; 
        }
        .stat-label { 
          color: #666; 
          font-size: 0.9em; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        th, td { 
          padding: 12px; 
          text-align: left; 
          border-bottom: 1px solid #ddd; 
        }
        th { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          font-weight: bold; 
        }
        tr:hover { 
          background-color: #f5f5f5; 
        }
        .badge { 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 0.8em; 
          font-weight: bold; 
        }
        .badge-simple { 
          background: #e2e8f0; 
          color: #475569; 
        }
        .badge-medium { 
          background: #dbeafe; 
          color: #1d4ed8; 
        }
        .badge-complex { 
          background: #fee2e2; 
          color: #dc2626; 
        }
        .footer { 
          text-align: center; 
          color: #666; 
          font-size: 0.9em; 
          border-top: 1px solid #ddd; 
          padding-top: 20px; 
          margin-top: 40px; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Estimation Report</h1>
        <p>Generated on ${new Date(generatedAt).toLocaleDateString('en-GB', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>
      
      ${summaryStats ? `
      <div class="summary">
        <div class="stat-card">
          <div class="stat-value">${summaryStats.totalEstimations}</div>
          <div class="stat-label">Total Estimations</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${summaryStats.totalHours}h</div>
          <div class="stat-label">Total Hours</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${summaryStats.avgHours}h</div>
          <div class="stat-label">Average Hours</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${summaryStats.totalScreens}</div>
          <div class="stat-label">Total Screens</div>
        </div>
      </div>
      ` : ''}
      
      <h2>📋 Estimation Details</h2>
      <table>
        <thead>
          <tr>
            <th>Estimation Name</th>
            <th>Project</th>
            <th>Version</th>
            <th>Total Hours</th>
            <th>Screens</th>
            <th>Created Date</th>
          </tr>
        </thead>
        <tbody>
          ${estimations.map((estimation: any) => `
            <tr>
              <td><strong>${estimation.name}</strong></td>
              <td>${estimation.projectName}</td>
              <td>${estimation.versionNumber}</td>
              <td><strong>${estimation.totalHours}h</strong></td>
              <td>${estimation.details.length}</td>
              <td>${new Date(estimation.createdAt).toLocaleDateString('en-GB')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      ${estimations.length > 0 ? `
      <h2>🔍 Screen Breakdown</h2>
      ${estimations.map((estimation: any) => `
        <h3>${estimation.name} - ${estimation.projectName}</h3>
        <table>
          <thead>
            <tr>
              <th>Screen Name</th>
              <th>Complexity</th>
              <th>Screen Type</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            ${estimation.details.map((detail: any) => `
              <tr>
                <td>${detail.screenName}</td>
                <td>
                  <span class="badge badge-${detail.complexity?.toLowerCase() || 'simple'}">
                    ${detail.complexity}
                  </span>
                </td>
                <td>${detail.screenType}</td>
                <td><strong>${detail.hours}h</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('')}
      ` : ''}
      
      <div class="footer">
        <p>This report was generated by EstimateFlow - Project Estimation Tool</p>
        <p>© ${new Date().getFullYear()} Revalsys Technologies. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}