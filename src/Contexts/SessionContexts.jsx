import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/Supabase";

export const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
        if (data) setProfile(data);
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) fetchProfile(session.user.id);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                if (session?.user) fetchProfile(session.user.id);
                else setProfile(null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return (
        <SessionContext.Provider value={{ session, profile, loading }}>
            {children}
        </SessionContext.Provider>
    );
};