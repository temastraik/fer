import { supabase } from '../supabaseClient';

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

export const fetchDisciplines = async () => {
  try {
    const { data, error } = await supabase
      .from('disciplines')
      .select('id, name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching disciplines:', error.message);
    throw error;
  }
};

export const fetchCompetitions = async (filters = {}) => {
  try {
    let query = supabase
      .from('competitions')
      .select(`
        id,
        name,
        description,
        type,
        status,
        registration_start_date,
        registration_end_date,
        start_date,
        end_date,
        disciplines(name)
      `)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.discipline_id) {
      query = query.eq('discipline_id', filters.discipline_id);
    }
    
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Format competitions data
    return data.map(comp => ({
      ...comp,
      discipline_name: comp.disciplines?.name
    }));
  } catch (error) {
    console.error('Error fetching competitions:', error.message);
    throw error;
  }
};