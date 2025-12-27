-- Enable realtime for simulation_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.simulation_sessions;

-- Add ranking badges
INSERT INTO public.badges (nome, descricao, icone, tipo, criterio) VALUES
('Top 1 - Campeão', 'Alcançou a primeira posição no ranking', '👑', 'ranking', '{"type": "ranking_position", "position": 1}'),
('Top 3 - Pódio', 'Alcançou uma posição no pódio (top 3)', '🥇', 'ranking', '{"type": "ranking_position", "position": 3}'),
('Top 10 - Elite', 'Entrou para o top 10 do ranking', '🏆', 'ranking', '{"type": "ranking_position", "position": 10}'),
('Sequência de 3', 'Conseguiu 3 vitórias consecutivas', '🔥', 'streak', '{"type": "win_streak", "count": 3}'),
('Sequência de 5', 'Conseguiu 5 vitórias consecutivas', '💥', 'streak', '{"type": "win_streak", "count": 5}'),
('Sequência de 10', 'Conseguiu 10 vitórias consecutivas - Lendário!', '⚡', 'streak', '{"type": "win_streak", "count": 10}'),
('Primeira Vitória', 'Conquistou sua primeira vitória na simulação', '🎉', 'milestone', '{"type": "total_wins", "count": 1}'),
('Veterano Vitorioso', 'Alcançou 10 vitórias no simulador', '🌟', 'milestone', '{"type": "total_wins", "count": 10}'),
('Mestre Salvador', 'Alcançou 50 vitórias no simulador', '💎', 'milestone', '{"type": "total_wins", "count": 50}'),
('Taxa 80%+', 'Manteve taxa de vitória acima de 80% com pelo menos 10 sessões', '📈', 'performance', '{"type": "win_rate", "rate": 80, "min_sessions": 10}')
ON CONFLICT DO NOTHING;