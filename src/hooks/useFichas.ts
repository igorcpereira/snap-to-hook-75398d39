import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useFichas = (limit?: number) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['fichas', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar a role do usuário
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      let query = supabase
        .from('fichas')
        .select('*')
        .order('created_at', { ascending: false });

      // Apenas vendedores e franqueados filtram por vendedor_id
      // Master, admin e gestor veem todas as fichas
      if (userRole?.role === 'vendedor') {
        query = query.eq('vendedor_id', user.id);
      }

      if (limit) {
        query = query.range(0, limit - 1);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};

export const useInvalidateFichas = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['fichas', user?.id] });
  };
};
