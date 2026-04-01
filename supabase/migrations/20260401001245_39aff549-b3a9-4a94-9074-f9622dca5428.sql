
-- 1. Create SECURITY DEFINER function for awarding badges
-- Validates: badge exists, not already awarded, session belongs to user
CREATE OR REPLACE FUNCTION public.award_badge(
  p_badge_id uuid,
  p_session_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Não autenticado');
  END IF;

  -- Verify badge exists
  IF NOT EXISTS (SELECT 1 FROM badges WHERE id = p_badge_id) THEN
    RETURN json_build_object('success', false, 'message', 'Badge não encontrado');
  END IF;

  -- Verify not already awarded
  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = v_user_id AND badge_id = p_badge_id) THEN
    RETURN json_build_object('success', false, 'message', 'Badge já conquistado');
  END IF;

  -- If session_id provided, verify it belongs to the user
  IF p_session_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM simulation_sessions WHERE id = p_session_id AND user_id = v_user_id) THEN
      RETURN json_build_object('success', false, 'message', 'Sessão não pertence ao usuário');
    END IF;
  END IF;

  INSERT INTO user_badges (user_id, badge_id, session_id)
  VALUES (v_user_id, p_badge_id, p_session_id);

  RETURN json_build_object('success', true, 'message', 'Badge concedido');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 2. Create SECURITY DEFINER function for saving weekly ranking
-- Computes stats from actual session data server-side
CREATE OR REPLACE FUNCTION public.save_weekly_ranking(
  p_week_start date,
  p_week_end date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_wins int;
  v_total int;
  v_points int;
  v_position int;
  v_win_rate numeric;
  v_existing_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Não autenticado');
  END IF;

  -- Compute actual stats from simulation_sessions
  SELECT
    COALESCE(SUM(CASE WHEN status IN ('won', 'vitoria') THEN 1 ELSE 0 END), 0),
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(CASE WHEN status IN ('won', 'vitoria') THEN
      100 + CASE WHEN duracao_segundos IS NOT NULL AND duracao_segundos < 300 THEN 50 ELSE 0 END
    ELSE 0 END), 0)
  INTO v_wins, v_total, v_points
  FROM simulation_sessions
  WHERE user_id = v_user_id
    AND criado_em >= p_week_start::timestamp with time zone
    AND criado_em <= (p_week_end + 1)::timestamp with time zone
    AND status IN ('won', 'vitoria', 'lost', 'derrota');

  IF v_total = 0 THEN
    RETURN json_build_object('success', false, 'message', 'Sem sessões nesta semana');
  END IF;

  v_win_rate := ROUND((v_wins::numeric / v_total) * 100, 2);

  -- Compute position from all users' points this week
  WITH user_points AS (
    SELECT ss.user_id as uid,
      SUM(CASE WHEN ss.status IN ('won', 'vitoria') THEN
        100 + CASE WHEN ss.duracao_segundos IS NOT NULL AND ss.duracao_segundos < 300 THEN 50 ELSE 0 END
      ELSE 0 END) as pts
    FROM simulation_sessions ss
    WHERE ss.criado_em >= p_week_start::timestamp with time zone
      AND ss.criado_em <= (p_week_end + 1)::timestamp with time zone
      AND ss.status IN ('won', 'vitoria', 'lost', 'derrota')
    GROUP BY ss.user_id
  )
  SELECT COUNT(*) + 1 INTO v_position
  FROM user_points
  WHERE pts > v_points;

  -- Check existing entry
  SELECT id INTO v_existing_id
  FROM weekly_ranking_history
  WHERE user_id = v_user_id AND week_start = p_week_start;

  IF v_existing_id IS NOT NULL THEN
    UPDATE weekly_ranking_history
    SET position = v_position, wins = v_wins, total_sessions = v_total,
        points = v_points, win_rate = v_win_rate, week_end = p_week_end
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO weekly_ranking_history (user_id, week_start, week_end, position, wins, total_sessions, points, win_rate)
    VALUES (v_user_id, p_week_start, p_week_end, v_position, v_wins, v_total, v_points, v_win_rate);
  END IF;

  RETURN json_build_object('success', true, 'message', 'Ranking salvo');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 3. Block direct INSERTs on user_badges (replace existing permissive policy)
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios badges" ON user_badges;
CREATE POLICY "Ninguém pode inserir badges diretamente" ON user_badges
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- 4. Block direct INSERTs on metas_alcancadas
DROP POLICY IF EXISTS "Usuários podem inserir suas metas alcançadas" ON metas_alcancadas;
CREATE POLICY "Ninguém pode inserir metas diretamente" ON metas_alcancadas
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- 5. Block direct INSERTs and UPDATEs on weekly_ranking_history
DROP POLICY IF EXISTS "Usuários podem inserir seu histórico de ranking" ON weekly_ranking_history;
CREATE POLICY "Ninguém pode inserir ranking diretamente" ON weekly_ranking_history
  FOR INSERT TO authenticated
  WITH CHECK (false);
