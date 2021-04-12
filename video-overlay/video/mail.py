import sendgrid
import os
from sendgrid import Mail, To, Email, Content


def send_mail(from_email, to_email, subject, content):
    sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
    mail = Mail(Email(from_email), To(to_email),
                subject, Content("text/html", content))
    response = sg.client.mail.send.post(request_body=mail.get())
    print(response.status_code)
