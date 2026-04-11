-- NYUMBA360 POSTGRESQL DATABASE SCHEMA
-- This file creates all necessary tables for the Nyumba360 platform

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('landlord', 'tenant', 'admin', 'property_manager', 'agent', 'maintenance')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_name VARCHAR(255) NOT NULL,
    property_address TEXT NOT NULL,
    property_city VARCHAR(100),
    property_country VARCHAR(100),
    total_units INTEGER DEFAULT 0,
    occupied_units INTEGER DEFAULT 0,
    vacant_units INTEGER DEFAULT 0,
    monthly_income DECIMAL(12,2) DEFAULT 0.00,
    description TEXT,
    amenities TEXT[],
    images TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rental Units table
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(50) NOT NULL,
    unit_type VARCHAR(50),
    monthly_rent DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2) DEFAULT 0.00,
    is_vacant BOOLEAN DEFAULT true,
    current_tenant_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(property_id, unit_number)
);

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    id_number VARCHAR(100),
    id_type VARCHAR(50),
    employer_name VARCHAR(255),
    employer_phone VARCHAR(20),
    monthly_income DECIMAL(10,2),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lease Agreements table
CREATE TABLE IF NOT EXISTS lease_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
    terms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rent Payments table
CREATE TABLE IF NOT EXISTS rent_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lease_id UUID NOT NULL REFERENCES lease_agreements(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Tickets table
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property Media table
CREATE TABLE IF NOT EXISTS property_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('image', 'video', 'document')),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unit Media table
CREATE TABLE IF NOT EXISTS unit_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('image', 'video', 'document')),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vacancies table
CREATE TABLE IF NOT EXISTS vacancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    monthly_rent DECIMAL(10,2),
    security_deposit DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'filled')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100),
    specialization TEXT[],
    service_areas TEXT[],
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    experience_years INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_properties INTEGER DEFAULT 0,
    active_properties INTEGER DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent Management table
CREATE TABLE IF NOT EXISTS agent_management (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) DEFAULT 'exclusive' CHECK (contract_type IN ('exclusive', 'non_exclusive')),
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    commission_type VARCHAR(50) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    fixed_commission DECIMAL(10,2) DEFAULT 0.00,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
    terms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    insight_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence_score DECIMAL(5,2) DEFAULT 0.00,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_vacant ON units(is_vacant);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_lease_agreements_property_id ON lease_agreements(property_id);
CREATE INDEX IF NOT EXISTS idx_lease_agreements_tenant_id ON lease_agreements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lease_agreements_status ON lease_agreements(status);
CREATE INDEX IF NOT EXISTS idx_rent_payments_tenant_id ON rent_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_property_id ON rent_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON rent_payments(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_property_id ON maintenance_tickets(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_status ON maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON property_media(property_id);
CREATE INDEX IF NOT EXISTS idx_unit_media_unit_id ON unit_media(unit_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_property_id ON vacancies(property_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_management_agent_id ON agent_management(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_management_landlord_id ON agent_management(landlord_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_property_id ON ai_insights(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lease_agreements_updated_at BEFORE UPDATE ON lease_agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rent_payments_updated_at BEFORE UPDATE ON rent_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_tickets_updated_at BEFORE UPDATE ON maintenance_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vacancies_updated_at BEFORE UPDATE ON vacancies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_management_updated_at BEFORE UPDATE ON agent_management FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
