import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useClientes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clientes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar a role do usuário
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      let query = supabase
        .from('clientes')
        .select(`
          *,
          fichas (codigo_ficha)
        `);

      // Apenas vendedores filtram por vendedor_id
      // Gestores, masters, admins e usuários da unidade "Todas" veem todos
      if (userRole?.role === 'vendedor') {
        query = query.eq('vendedor_id', user.id);
      }
      // Para franqueados, a política RLS já cuida do filtro por unidade

      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};
