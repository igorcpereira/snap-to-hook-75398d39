import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 20;

export const useClientes = (termoBusca?: string) => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['clientes', user?.id, termoBusca],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return { data: [], nextPage: undefined };

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
        `, { count: 'exact' });

      // Apenas vendedores filtram por vendedor_id
      if (userRole?.role === 'vendedor') {
        query = query.eq('vendedor_id', user.id);
      }

      // Filtrar por termo de busca se fornecido
      if (termoBusca && termoBusca.trim()) {
        const termo = `%${termoBusca.trim()}%`;
        const termoSemFormatacao = termoBusca.replace(/\D/g, '');
        
        query = query.or(`nome.ilike.${termo},telefone.ilike.%${termoSemFormatacao}%,fichas.codigo_ficha.ilike.${termo}`);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      const hasMore = count ? (pageParam + 1) * PAGE_SIZE < count : false;
      
      return {
        data: data || [],
        nextPage: hasMore ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user?.id,
    initialPageParam: 0,
  });
};
