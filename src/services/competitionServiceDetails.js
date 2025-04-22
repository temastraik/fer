import { supabase } from '../supabaseClient';

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

export const fetchCompetitionDetails = async (id) => {
  try {
    const { data: competitionData, error: competitionError } = await supabase
      .from('competitions')
      .select(`
        *,
        disciplines(name),
        regions(name)
      `)
      .eq('id', id)
      .single();
      
    if (competitionError) throw competitionError;
    
    if (competitionData) {
      const { data: organizerData, error: organizerError } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', competitionData.organizer_user_id)
        .single();
        
      if (!organizerError) {
        competitionData.organizer = organizerData;
      }
    }
    
    return competitionData;
  } catch (error) {
    console.error('Error fetching competition details:', error.message);
    throw error;
  }
};

export const fetchUserApplication = async (competitionId, userId) => {
  const { data, error } = await supabase
    .from('applications')
    .select('id, status')
    .eq('competition_id', competitionId)
    .eq('applicant_user_id', userId)
    .maybeSingle();
    
  if (error) throw error;
  return data;
};

export const fetchUserTeams = async (userId) => {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name')
    .eq('captain_user_id', userId);
    
  if (error) throw error;
  return data || [];
};

export const fetchTeamApplications = async (competitionId, teamIds) => {
  if (!teamIds || teamIds.length === 0) return null;
  
  const { data, error } = await supabase
    .from('applications')
    .select('id, applicant_team_id, status')
    .eq('competition_id', competitionId)
    .in('applicant_team_id', teamIds)
    .maybeSingle();
    
  if (error) throw error;
  return data;
};

export const updateApplicationStatus = async (competitionId, teamIds) => {
  const { data, error } = await supabase
    .from('applications')
    .select('id, applicant_team_id, status')
    .eq('competition_id', competitionId)
    .in('applicant_team_id', teamIds)
    .maybeSingle();

  if (error) throw error;
  return data;
};