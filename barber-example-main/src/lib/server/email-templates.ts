import * as m from '$lib/paraglide/messages.js';

/**
 * Generates HTML email template for appointment confirmations
 */
export function getAppointmentConfirmationHtml(
	firstName: string,
	lastName: string,
	service: string,
	date: string,
	time: string,
	stylist: string
): string {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
    }
    .container { 
      padding: 20px; 
      border: 1px solid #e1e1e1; 
      border-radius: 5px;
      background-color: #f9f9f9;
    }
    .header { 
      background-color: #343a40; 
      color: white; 
      padding: 15px; 
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content { 
      background-color: white; 
      padding: 20px; 
      border-radius: 0 0 5px 5px;
    }
    .appointment-details {
      margin: 20px 0;
      border-left: 3px solid #343a40;
      padding-left: 15px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 0.9em;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${m.email_confirmation_header()}</h2>
    </div>
    <div class="content">
      <p>${m.email_confirmation_greeting({ firstName, lastName })}</p>
      
      <p>${m.email_confirmation_thank_you()}</p>
      
      <div class="appointment-details">
        <p><strong>${m.email_confirmation_service()}:</strong> ${service}</p>
        <p><strong>${m.email_confirmation_date()}:</strong> ${date}</p>
        <p><strong>${m.email_confirmation_time()}:</strong> ${time}</p>
        <p><strong>${m.email_confirmation_stylist()}:</strong> ${stylist}</p>
      </div>
      
      <p>${m.email_confirmation_changes()}</p>
      
      <p>${m.email_confirmation_looking_forward()}</p>
      
      <p>${m.email_confirmation_regards()}<br>${m.email_confirmation_team()}</p>
    </div>
    <div class="footer">
      <p>${m.email_confirmation_automated()}</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generates plain text email template for appointment confirmations
 */
export function getAppointmentConfirmationText(
	firstName: string,
	lastName: string,
	service: string,
	date: string,
	time: string,
	stylist: string
): string {
	return `
${m.email_confirmation_greeting({ firstName, lastName })}

${m.email_confirmation_thank_you()}

${m.email_confirmation_service()}: ${service}
${m.email_confirmation_date()}: ${date}
${m.email_confirmation_time()}: ${time}
${m.email_confirmation_stylist()}: ${stylist}

${m.email_confirmation_changes()}

${m.email_confirmation_looking_forward()}

${m.email_confirmation_regards()}
${m.email_confirmation_team()}
`;
}