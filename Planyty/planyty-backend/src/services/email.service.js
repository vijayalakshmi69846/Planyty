const nodemailer = require('nodemailer');
require('dotenv').config();
// top of email.service.js
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for others
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Helps with local development/SMTP issues
  }
});
/**
 * 1. COMPANY ADMIN INVITATION (The Premium Indigo Template)
 * Used when a new company is registered.
 */
const sendAdminInvitationEmail = async (email, token, companyName = 'Your Company') => {
  try {
    const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation/${token}`;
    
    const mailOptions = {
      from: `"Planyty" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to ${companyName}! You're the Admin`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 20px; border-radius: 16px 16px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800;">Welcome, Company Admin!</h1>
            <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Your <strong>${companyName}</strong> workspace is ready</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #111827; margin-top: 0; font-size: 24px;">Congratulations! 🎉</h2>
            <p style="color: #4b5563; line-height: 1.6;">Your company <strong>${companyName}</strong> has been successfully registered on Planyty.</p>
            
            <p style="color: #4b5563; font-weight: bold; margin-top: 25px;">As Admin, you have full access to:</p>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
              <tr>
                <td width="50%" style="padding: 10px;">
                  <div style="background: #f5f3ff; padding: 15px; border-radius: 12px; border: 1px solid #ddd6fe; min-height: 80px;">
                    <div style="font-weight: bold; color: #5b21b6;">👥 Team Management</div>
                    <div style="font-size: 12px; color: #6d28d9;">Roles & Permissions</div>
                  </div>
                </td>
                <td width="50%" style="padding: 10px;">
                  <div style="background: #eff6ff; padding: 15px; border-radius: 12px; border: 1px solid #dbeafe; min-height: 80px;">
                    <div style="font-weight: bold; color: #1e40af;">💳 Billing & Settings</div>
                    <div style="font-size: 12px; color: #1e40af;">Subscriptions & Workspace</div>
                  </div>
                </td>
              </tr>
            </table>

            <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 15px; margin: 25px 0;">
              <strong style="color: #1e293b; display: block;">📬 Invitations Sent</strong>
              <span style="font-size: 13px; color: #64748b;">Your Team Lead invitations are out! They can join as soon as they accept.</span>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${invitationLink}" style="background-color: #4f46e5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Setup Your Admin Account</a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 25px;">
              <h3 style="font-size: 16px; color: #111827;">🚀 Quick Start Guide</h3>
              <ul style="color: #4b5563; font-size: 14px; line-height: 1.8;">
                <li>Accept invitation & create account</li>
                <li>Review company settings</li>
                <li>Check Team Lead status</li>
              </ul>
            </div>
          </div>
        </div>`
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Error in sendAdminInvitationEmail:', error);
    return false;
  }
};

/**
 * 2. TEAM LEAD INVITATION (Purple/Pink Gradient)
 * Sent to individuals designated as Team Leads during onboarding.
 */
const sendTeamLeadInvitationEmail = async (email, token, companyName = 'Your Company', inviterName = 'Planyty') => {
  try {
    const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation/${token}`;
    const safeCompany = companyName || 'your company';
    const safeInviter = inviterName || 'A Company Admin';

    const mailOptions = {
      from: `"Planyty" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🏆 Team Lead Invitation: Join ${safeCompany}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdf2f8; padding: 20px;">
          
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); padding: 40px 20px; border-radius: 16px 16px 0 0; text-align: center; color: white;">
            <div style="font-size: 40px; margin-bottom: 10px;">🏆</div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Welcome, Team Lead!</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Elevate your team at <strong>${safeCompany}</strong></p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #111827; margin-top: 0; font-size: 22px;">You've been designated as a Team Lead!</h2>
            <p style="color: #4b5563; line-height: 1.6; font-size: 15px;">
              <strong>${safeInviter}</strong> has invited you to take a leadership role within the <strong>${safeCompany}</strong> workspace on Planyty.
            </p>

            <p style="color: #111827; font-weight: bold; margin-top: 25px;">Your Team Lead privileges include:</p>

            <div style="margin: 20px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="50%" style="padding: 8px;">
                    <div style="background: #fdf4ff; padding: 15px; border-radius: 12px; border: 1px solid #f5d0fe; min-height: 100px;">
                      <div style="font-weight: bold; color: #86198f; margin-bottom: 5px;">🚀 Project Templates</div>
                      <div style="font-size: 12px; color: #a21caf;">Build and deploy reusable project workflows for your team.</div>
                    </div>
                  </td>
                  <td width="50%" style="padding: 8px;">
                    <div style="background: #f5f3ff; padding: 15px; border-radius: 12px; border: 1px solid #ddd6fe; min-height: 100px;">
                      <div style="font-weight: bold; color: #5b21b6; margin-bottom: 5px;">📊 Performance Tracking</div>
                      <div style="font-size: 12px; color: #6d28d9;">Monitor task progress and team velocity in real-time.</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 8px;">
                    <div style="background: #f0f9ff; padding: 15px; border-radius: 12px; border: 1px solid #bae6fd; min-height: 100px;">
                      <div style="font-weight: bold; color: #075985; margin-bottom: 5px;">👥 Resource Management</div>
                      <div style="font-size: 12px; color: #0369a1;">Assign tasks and manage workload capacity effectively.</div>
                    </div>
                  </td>
                  <td width="50%" style="padding: 8px;">
                    <div style="background: #f0fdfa; padding: 15px; border-radius: 12px; border: 1px solid #99f6e4; min-height: 100px;">
                      <div style="font-weight: bold; color: #115e59; margin-bottom: 5px;">💬 Team Collaboration</div>
                      <div style="font-size: 12px; color: #0f766e;">Invite members and manage permissions within your projects.</div>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${invitationLink}" 
                 style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px 0 rgba(217, 70, 239, 0.39);">
                Accept Role & Start Leading
              </a>
            </div>

            <div style="border-top: 1px solid #f3e8ff; padding-top: 25px; margin-top: 10px;">
              <h3 style="color: #111827; font-size: 17px; margin-bottom: 12px;">Next Steps for You:</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="30" style="vertical-align: top; color: #d946ef; font-weight: bold;">1.</td>
                  <td style="padding-bottom: 10px; font-size: 14px; color: #4b5563;">Accept this invitation to activate your Team Lead dashboard.</td>
                </tr>
                <tr>
                  <td width="30" style="vertical-align: top; color: #d946ef; font-weight: bold;">2.</td>
                  <td style="padding-bottom: 10px; font-size: 14px; color: #4b5563;">Set up your team profile and preferences.</td>
                </tr>
                <tr>
                  <td width="30" style="vertical-align: top; color: #d946ef; font-weight: bold;">3.</td>
                  <td style="padding-bottom: 10px; font-size: 14px; color: #4b5563;">Browse and customize your first project template.</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
              <p>You received this because you were invited to Planyty.</p>
              <p>© ${new Date().getFullYear()} Planyty. Plan with clarity.</p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Team Lead Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error in sendTeamLeadInvitationEmail:', error);
    return false;
  }
};
/**
 * 3. STANDARD ROLE INVITATION (High-Fidelity)
 * Used for inviting standard members (Managers, Contributors, Viewers)
 */
const sendInvitationEmail = async (email, token, role = 'member', inviterName = 'A teammate', workspaceName = 'a Workspace') => {
  try {
    const safeRole = (role || 'member').replace('_', ' ').toUpperCase();
    const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation/${token}`;
    const safeInviter = inviterName || 'A team member';

    const mailOptions = {
      from: `"Planyty" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `👋 You've been invited to ${workspaceName} as a ${safeRole}`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
          
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 35px 20px; border-radius: 16px 16px 0 0; text-align: center; color: white;">
            <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 8px 16px; border-radius: 50px; font-size: 12px; font-weight: bold; letter-spacing: 1px; margin-bottom: 15px; text-transform: uppercase;">
              New Invitation
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Join ${workspaceName}</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 0;">
              Hello! <strong>${safeInviter}</strong> has invited you to collaborate on <strong>${workspaceName}</strong> via Planyty.
            </p>

            <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
              <span style="color: #6d28d9; font-size: 14px; display: block; margin-bottom: 5px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Assigned Role</span>
              <span style="color: #1e1b4b; font-size: 22px; font-weight: 800;">${safeRole}</span>
            </div>

            <p style="color: #111827; font-weight: bold; margin-bottom: 15px;">What you can do with this access:</p>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563;">✔ Access shared project boards and timelines.</td></tr>
              <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563;">✔ Collaborate with your team in real-time.</td></tr>
            </table>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="background-color: #4f46e5; color: white; padding: 16px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Join Workspace
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              This link expires in 7 days.
            </p>
          </div>
        </div>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Invitation Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error in sendInvitationEmail:', error);
    return false;
  }
};
/*
 * 4. MEMBER ADDED NOTIFICATION (High-Fidelity)
 * Triggered when a user is directly added to a team or project.
 */
const sendMemberAddedEmail = async (email, teamName = 'the team', inviterName = 'A teammate', taskData = null) => {
  try {
    const dashboardLink = `${process.env.FRONTEND_URL}/dashboard`;
    const safeTeam = teamName || 'a new project';
    const safeInviter = inviterName || 'A teammate';
    
    // Enhanced Task Section with Conditional Rendering
    let taskSection = "";
    if (taskData && taskData.name) {
      taskSection = `
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <span style="background-color: #f59e0b; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-right: 10px;">Action Required</span>
            <span style="color: #92400e; font-size: 14px; font-weight: 600;">Immediate Task Assigned</span>
          </div>
          <h3 style="margin: 0; color: #1e1b4b; font-size: 18px;">${taskData.name}</h3>
          <p style="margin: 10px 0 0; font-size: 14px; color: #78350f;">
            <strong>Due Date:</strong> ${taskData.dueDate || 'Flexible'}
          </p>
          <div style="margin-top: 15px; border-top: 1px solid #fde68a; padding-top: 10px;">
             <p style="margin: 0; font-size: 13px; color: #b45309; font-style: italic;">"Please review the task details once you log in."</p>
          </div>
        </div>`;
    }

    const mailOptions = {
      from: `"Planyty" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🚀 You've been added to ${safeTeam}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f3f4f6; padding: 20px;">
          
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 20px; border-radius: 16px 16px 0 0; text-align: center; color: white;">
            <div style="font-size: 40px; margin-bottom: 10px;">🎉</div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Welcome to the Team!</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">You are now a part of <strong>${safeTeam}</strong></p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 0;">
              Hi there! <strong>${safeInviter}</strong> has just added you to the workspace for <strong>${safeTeam}</strong>. 
              We're excited to have you on board!
            </p>

            ${taskSection}

            <p style="color: #111827; font-weight: bold; margin-bottom: 15px;">Next steps for you:</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="color: #4b5563; font-size: 14px; line-height: 1.8;">
              <tr>
                <td width="25" style="vertical-align: top; color: #7c3aed;">•</td>
                <td>Review the current project timeline.</td>
              </tr>
              <tr>
                <td width="25" style="vertical-align: top; color: #7c3aed;">•</td>
                <td>Check for any shared documents or resources.</td>
              </tr>
              <tr>
                <td width="25" style="vertical-align: top; color: #7c3aed;">•</td>
                <td>Introduce yourself to the team in the comments.</td>
              </tr>
            </table>

            <div style="text-align: center; margin: 40px 0 20px 0;">
              <a href="${dashboardLink}" 
                 style="background-color: #7c3aed; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.3);">
                View My Dashboard
              </a>
            </div>

            <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
              <p>Sent via Planyty Project Management</p>
              <p>© ${new Date().getFullYear()} Planyty. All rights reserved.</p>
            </div>
          </div>
        </div>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Member Added Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error in sendMemberAddedEmail:', error);
    return false;
  }
};
module.exports = {
  sendAdminInvitationEmail,
  sendTeamLeadInvitationEmail,
  sendInvitationEmail,
  sendMemberAddedEmail,
  verifyEmailConfig: async () => await transporter.verify()
};