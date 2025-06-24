
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  orderId: string;
  userEmail: string;
  userName?: string;
  fanCardTitle: string;
  quantity: number;
  totalAmount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = "https://pmrqueeoojexmuuyefba.supabase.co";
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, userEmail, userName, fanCardTitle, quantity, totalAmount }: OrderNotificationRequest = await req.json();

    console.log('Order notification request:', {
      orderId,
      userEmail,
      userName,
      fanCardTitle,
      quantity,
      totalAmount
    });

    // Prepare email content
    const emailSubject = "Thank you for your Fan Card order!";
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank you for your order!</h2>
        
        <p>Dear ${userName || 'Customer'},</p>
        
        <p>Thank you for ordering our Fan Cards! We have received your request for:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Item:</strong> ${quantity} x ${fanCardTitle}</p>
          <p><strong>Total:</strong> $${totalAmount}</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
        </div>
        
        <p>Someone from our team will be in touch with you within the next 48 hours with further details and shipping information.</p>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        The Fan Cards Team</p>
      </div>
    `;

    // Send email using Resend if API key is available
    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Fan Cards <orders@resend.dev>',
            to: [userEmail],
            subject: emailSubject,
            html: emailContent,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          console.error('Resend API error:', errorData);
          throw new Error(`Resend API error: ${emailResponse.status}`);
        }

        const emailResult = await emailResponse.json();
        console.log('Email sent successfully:', emailResult);
      } catch (emailError) {
        console.error('Failed to send email via Resend:', emailError);
        // Continue with the process even if email fails
      }
    } else {
      console.log('RESEND_API_KEY not configured, email content prepared:', emailContent);
    }

    // Update the order to mark email as sent
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        email_sent: true,
        notification_sent_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        orderId,
        emailSent: !!resendApiKey
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
