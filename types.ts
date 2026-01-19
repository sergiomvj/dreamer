export interface AdAccount {
  id: string;
  tenant_id: string;
  ad_platform_id: string;
  platform_account_id: string;
  account_name: string;
  access_token_encrypted: string;
  created_at: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  start_time: string;
  stop_time?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  start_time: string;
  end_time?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  targeting?: any;
}

export interface MetaAd {
  id: string;
  name: string;
  status: string;
  adset_id: string;
  creative?: {
    id: string;
    thumbnail_url?: string;
  };
}

export interface MetaInsight {
  campaign_id: string;
  adset_id: string;
  ad_id: string;
  spend: string;
  impressions: string;
  clicks: string;
  conversions?: { action_type: string; value: string }[];
  date_start: string;
  date_stop: string;
}

export interface AdMetric {
  id: string;
  metric_date: string;
  ad_account_id: string;
  ad_campaign_id?: string;
  ad_set_id?: string;
  ad_id?: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
}

export interface AdRule {
  id: string;
  tenant_id: string;
  name: string;
  metric: 'cpa' | 'spend' | 'roas' | 'cpc';
  operator: '>' | '<' | '>=';
  value: number;
  action: 'pause_campaign' | 'notify_manager';
  scope: 'campaign' | 'adset' | 'ad';
  is_active: boolean;
}

export interface Lead {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: 'new' | 'open' | 'qualified' | 'disqualified' | 'customer';
  score: number;
  intent: 'cold' | 'warm' | 'hot';
  source: any;
  created_at: string;
  updated_at: string;
}

export interface LeadEvent {
  id: string;
  tenant_id: string;
  lead_id: string;
  flow_id?: string;
  event_code: string;
  payload: any;
  happened_at: string;
}

export interface LeadTask {
  id: string;
  tenant_id: string;
  lead_id: string;
  title: string;
  task_type: 'call' | 'email' | 'meeting' | 'todo';
  due_at?: string;
  status: 'open' | 'completed' | 'cancelled';
  metadata?: any;
  created_at: string;
}

export interface ScrapingTarget {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  platform: 'linkedin' | 'google' | 'instagram' | 'amazon' | 'other';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  last_run_at?: string;
  config?: any;
  created_at: string;
}

export interface RawContact {
  id: string;
  tenant_id: string;
  scraping_target_id: string;
  source_platform: string;
  data: any;
  processed: boolean;
  lead_id?: string;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  tenant_id: string;
  name: string;
  subject: string;
  body_content: string;
  variables: string[];
  created_at: string;
}

export interface EmailSequence {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused';
  created_at: string;
}

export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  template_id?: string;
  step_order: number;
  delay_hours: number;
  step_type: 'email' | 'wait' | 'task';
  created_at: string;
  // Join fields
  email_templates?: EmailTemplate;
}

export interface WhatsAppTemplate {
  id: string;
  tenant_id: string;
  name: string;
  content: string;
  category: 'marketing' | 'utility' | 'authentication';
  status: 'approved' | 'rejected' | 'pending';
  created_at: string;
}

export interface WhatsAppConversation {
  id: string;
  tenant_id: string;
  lead_id?: string;
  phone_number: string;
  status: 'open' | 'closed' | 'expired';
  last_message_at: string;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
}
