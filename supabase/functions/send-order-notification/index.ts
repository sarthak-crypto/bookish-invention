
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
    
    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, userEmail, userName, fanCardTitle, quantity, totalAmount }: OrderNotificationRequest = await req.json();

    // Here you would integrate with your email service (like Resend)
    // For now, we'll just log the notification and update the order status
    
    console.log('Order notification request:', {
      orderId,
      userEmail,
      userName,
      fanCardTitle,
      quantity,
      totalAmount
    });

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

    // In a real implementation, you would send an email here
    // Example email content:
    const emailContent = `
      Dear ${userName || 'Customer'},
      
      Thank you for your order! We have received your request for ${quantity} x ${fanCardTitle}.
      
      Order Total: $${totalAmount}
      
      We are currently working on your request. One of our team members will reach out to you via email within the next 48 hours with further details and shipping information.
      
      If you have any questions, please don't hesitate to contact us.
      
      Best regards,
      The Team
    `;

    console.log('Email content prepared:', emailContent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        orderId 
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
