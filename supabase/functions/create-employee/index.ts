// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from 'npm:supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateEmployeeRequest {
  name: string
  email: string
  password: string
  group_id?: string
  status?: 'active' | 'inactive'
  avatar_url?: string
  allow_booking?: boolean
  allow_overlap?: boolean
  birthday?: string
  phone?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header (user's JWT)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create client with user's JWT to verify they're authenticated and get their salon
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the calling user's salon membership and check if they're an owner
    const { data: membership, error: membershipError } = await supabaseUser
      .from('salon_members')
      .select('salon_id, role')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'You are not a member of any salon' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (membership.role !== 'owner') {
      return new Response(
        JSON.stringify({ error: 'Only salon owners can create employees' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: CreateEmployeeRequest = await req.json()
    
    if (!body.name || !body.email || !body.password) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Create auth user using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: body.name,
      }
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = authData.user.id

    // Step 2: Create employee record
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        salon_id: membership.salon_id,
        user_id: newUserId,
        name: body.name,
        email: body.email,
        group_id: body.group_id || null,
        status: body.status || 'active',
        avatar_url: body.avatar_url || null,
        allow_booking: body.allow_booking ?? true,
        allow_overlap: body.allow_overlap ?? false,
        birthday: body.birthday || null,
        phone: body.phone || null,
      })
      .select()
      .single()

    if (employeeError) {
      // Rollback: delete the created auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return new Response(
        JSON.stringify({ error: `Failed to create employee: ${employeeError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Add user to salon_members with employee permissions
    const { error: memberError } = await supabaseAdmin
      .from('salon_members')
      .insert({
        user_id: newUserId,
        salon_id: membership.salon_id,
        role: 'employee',
        permissions: {
          customers: { create: true, read: true, update: true, delete: false },
          services: { create: false, read: true, update: false, delete: false },
          bookings: { create: true, read: true, update: true, delete: false },
          products: { create: false, read: true, update: false, delete: false },
          employees: { create: false, read: false, update: false, delete: false },
        }
      })

    if (memberError) {
      // Rollback: delete employee and auth user
      await supabaseAdmin.from('employees').delete().eq('id', employee.id)
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return new Response(
        JSON.stringify({ error: `Failed to add member: ${memberError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        employee,
        message: `Employee ${body.name} created successfully. They can now login with ${body.email}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
