'use client'

import { createClient } from '@/lib/supabase/client'
import { getURL } from '@/lib/utils'

export async function signInWithGoogle() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${getURL()}auth/callback`,
        },
    })

    if (error) {
        console.error('Auth error:', error.message)
    }
}

// 1. Verify the Signup OTP
export async function verifySignupOTP(email: string, token: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
    });
    return { data, error };
}

// 3. Send the Reset Password OTP
export async function sendPasswordResetOTP(email: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
}

export async function resetPasswordWithOTP(email: string, token: string, newPassword: string) {
    const supabase = await createClient();

    // 1. Verify the OTP first
    const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
    });

    if (verifyError) return { error: verifyError.message };

    // 2. Update the password immediately after verification
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (updateError) return { error: updateError.message };

    return { success: true };
}

export async function signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('Error signing out:', error.message)
    } else {
        window.location.href = '/'
    }
}

export async function signUp(email: string, password: string, username: string, display_name: string) {
    const supabase = createClient()

    // 1. Check if Username OR Email already exists in the profiles table
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username, email')
        .or(`username.eq.${username},email.eq.${email}`)
        .maybeSingle()

    if (existingProfile) {
        if (existingProfile.username === username) {
            return { data: null, error: { message: "That username is already taken. Please choose another one!" } as any }
        }
        if (existingProfile.email === email) {
            return { data: null, error: { message: "An account with this email already exists. Try logging in instead!" } as any }
        }
    }

    // 2. Proceed with Supabase Auth Signup
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                display_name,
            }
        }
    })

    // 3. Handle specific Database Trigger errors (like race conditions)
    if (error) {
        if (error.message.includes('Database error saving new user')) {
            return { data: null, error: { message: "Registration failed. This username or email might already be in use." } as any }
        }
        return { data: null, error }
    }

    return { data, error }
}

export async function logIn(email: string, password: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    return { data, error }
}

export async function login({ identifier, password }: any) {
    const supabase = createClient()

    let email = identifier;

    // If the identifier doesn't look like an email, assume it's a username
    if (!identifier.includes('@')) {
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', identifier)
            .single();

        if (data) email = data.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) throw error
    return data
}