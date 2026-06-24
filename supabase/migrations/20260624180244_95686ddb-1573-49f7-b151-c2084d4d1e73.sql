
CREATE OR REPLACE FUNCTION public.award_badge(p_badge_id uuid, p_session_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_criterio jsonb;
  v_tipo text;
  v_type text;
  v_session record;
  v_count int;
  v_wins int;
  v_total int;
  v_rate numeric;
  v_min_hp int;
  v_hints int;
  v_treatments int;
  v_goals_total int;
  v_goals_reached int;
  v_distinct_cases int;
  v_best_streak int;
  v_tmp_streak int;
  v_session_rec record;
  v_position int;
  v_user_wins int;
  v_recent_all_won boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Não autenticado');
  END IF;

  SELECT criterio INTO v_criterio FROM badges WHERE id = p_badge_id;
  IF v_criterio IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Badge não encontrado');
  END IF;

  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = v_user_id AND badge_id = p_badge_id) THEN
    RETURN json_build_object('success', false, 'message', 'Badge já conquistado');
  END IF;

  IF p_session_id IS NOT NULL THEN
    SELECT * INTO v_session FROM simulation_sessions WHERE id = p_session_id AND user_id = v_user_id;
    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'message', 'Sessão não pertence ao usuário');
    END IF;
  END IF;

  v_tipo := v_criterio->>'tipo';
  v_type := v_criterio->>'type';

  -- Criteria requiring a winning session
  IF v_tipo IN ('primeira_vitoria','sem_dicas','tempo_recorde','todas_metas','hp_alto','velocidade_estabilizacao','economia_tratamentos') THEN
    IF v_session.id IS NULL OR v_session.status NOT IN ('won','vitoria') THEN
      RETURN json_build_object('success', false, 'message', 'Critério não atingido');
    END IF;
  END IF;

  IF v_tipo = 'primeira_vitoria' THEN
    SELECT COUNT(*) INTO v_wins FROM simulation_sessions
    WHERE user_id = v_user_id AND status IN ('won','vitoria');
    IF v_wins < 1 THEN
      RETURN json_build_object('success', false, 'message', 'Critério não atingido');
    END IF;

  ELSIF v_tipo = 'sem_dicas' THEN
    SELECT COUNT(*) INTO v_hints FROM session_decisions
    WHERE session_id = p_session_id AND tipo = 'hint_used';
    IF v_hints > 0 THEN
      RETURN json_build_object('success', false, 'message', 'Dicas foram utilizadas');
    END IF;

  ELSIF v_tipo = 'tempo_recorde' THEN
    IF COALESCE(v_session.duracao_segundos, 999999) > COALESCE((v_criterio->>'tempo_maximo')::int, 0) THEN
      RETURN json_build_object('success', false, 'message', 'Tempo excedido');
    END IF;

  ELSIF v_tipo = 'velocidade_estabilizacao' THEN
    IF COALESCE(v_session.duracao_segundos, 999999) > COALESCE((v_criterio->>'tempo_estabilizacao')::int, 0) THEN
      RETURN json_build_object('success', false, 'message', 'Tempo excedido');
    END IF;

  ELSIF v_tipo = 'todas_metas' THEN
    SELECT COUNT(*) INTO v_goals_total FROM metas_aprendizado WHERE case_id = v_session.case_id;
    SELECT COUNT(DISTINCT meta_id) INTO v_goals_reached FROM metas_alcancadas
    WHERE session_id = p_session_id AND user_id = v_user_id;
    IF v_goals_total = 0 OR v_goals_reached < v_goals_total THEN
      RETURN json_build_object('success', false, 'message', 'Nem todas as metas foram alcançadas');
    END IF;

  ELSIF v_tipo = 'hp_alto' THEN
    SELECT COALESCE(MIN(hp_depois), 100) INTO v_min_hp FROM session_decisions WHERE session_id = p_session_id;
    IF v_min_hp < COALESCE((v_criterio->>'hp_minimo')::int, 0) THEN
      RETURN json_build_object('success', false, 'message', 'HP mínimo não atingido');
    END IF;

  ELSIF v_tipo = 'economia_tratamentos' THEN
    SELECT COUNT(*) INTO v_treatments FROM session_decisions
    WHERE session_id = p_session_id AND tipo = 'treatment';
    IF v_treatments > COALESCE((v_criterio->>'max_tratamentos')::int, 0) THEN
      RETURN json_build_object('success', false, 'message', 'Excedeu tratamentos máximos');
    END IF;

  ELSIF v_tipo = 'total_sessoes' THEN
    SELECT COUNT(*) INTO v_total FROM simulation_sessions WHERE user_id = v_user_id;
    IF v_total < COALESCE((v_criterio->>'quantidade')::int, 0) THEN
      RETURN json_build_object('success', false, 'message', 'Sessões insuficientes');
    END IF;

  ELSIF v_tipo = 'casos_diferentes' THEN
    SELECT COUNT(DISTINCT case_id) INTO v_distinct_cases FROM simulation_sessions WHERE user_id = v_user_id;
    IF v_distinct_cases < COALESCE((v_criterio->>'quantidade')::int, 0) THEN
      RETURN json_build_object('success', false, 'message', 'Casos distintos insuficientes');
    END IF;

  ELSIF v_tipo = 'serie_vitorias' THEN
    v_count := COALESCE((v_criterio->>'quantidade')::int, 0);
    SELECT bool_and(status IN ('won','vitoria')) INTO v_recent_all_won
    FROM (
      SELECT status FROM simulation_sessions
      WHERE user_id = v_user_id
      ORDER BY criado_em DESC
      LIMIT v_count
    ) s;
    SELECT COUNT(*) INTO v_total FROM simulation_sessions WHERE user_id = v_user_id;
    IF v_total < v_count OR NOT COALESCE(v_recent_all_won, false) THEN
      RETURN json_build_object('success', false, 'message', 'Série de vitórias não atingida');
    END IF;

  ELSIF v_type = 'total_wins' THEN
    SELECT COUNT(*) INTO v_wins FROM simulation_sessions
    WHERE user_id = v_user_id AND status IN ('won','vitoria');
    IF v_wins < COALESCE((v_criterio->>'count')::int, 0) THEN
      RETURN json_build_object('success', false, 'message', 'Vitórias insuficientes');
    END IF;

  ELSIF v_type = 'win_rate' THEN
    SELECT
      COUNT(*) FILTER (WHERE status IN ('won','vitoria')),
      COUNT(*) FILTER (WHERE status IN ('won','vitoria','lost','derrota'))
    INTO v_wins, v_total
    FROM simulation_sessions WHERE user_id = v_user_id;
    IF v_total < COALESCE((v_criterio->>'min_sessions')::int, 0) THEN
      RETURN json_build_object('success', false, 'message', 'Sessões insuficientes');
    END IF;
    v_rate := CASE WHEN v_total > 0 THEN (v_wins::numeric / v_total) * 100 ELSE 0 END;
    IF v_rate < COALESCE((v_criterio->>'rate')::numeric, 0) THEN
      RETURN json_build_object('success', false, 'message', 'Taxa de vitória insuficiente');
    END IF;

  ELSIF v_type = 'win_streak' THEN
    v_best_streak := 0;
    v_tmp_streak := 0;
    FOR v_session_rec IN
      SELECT status FROM simulation_sessions
      WHERE user_id = v_user_id AND status IN ('won','vitoria','lost','derrota')
      ORDER BY criado_em ASC
    LOOP
      IF v_session_rec.status IN ('won','vitoria') THEN
        v_tmp_streak := v_tmp_streak + 1;
        IF v_tmp_streak > v_best_streak THEN v_best_streak := v_tmp_streak; END IF;
      ELSE
        v_tmp_streak := 0;
      END IF;
    END LOOP;
    IF v_best_streak < COALESCE((v_criterio->>'count')::int, 0) THEN
      RETURN json_build_object('success', false, 'message', 'Sequência de vitórias insuficiente');
    END IF;

  ELSIF v_type = 'ranking_position' THEN
    SELECT COUNT(*) INTO v_user_wins FROM simulation_sessions
    WHERE user_id = v_user_id AND status IN ('won','vitoria');
    IF v_user_wins = 0 THEN
      RETURN json_build_object('success', false, 'message', 'Sem vitórias');
    END IF;
    SELECT COUNT(*) + 1 INTO v_position
    FROM (
      SELECT user_id, COUNT(*) AS wins FROM simulation_sessions
      WHERE status IN ('won','vitoria')
      GROUP BY user_id
    ) u
    WHERE u.wins > v_user_wins;
    IF v_position > COALESCE((v_criterio->>'position')::int, 0) THEN
      RETURN json_build_object('success', false, 'message', 'Posição no ranking insuficiente');
    END IF;

  ELSE
    RETURN json_build_object('success', false, 'message', 'Critério desconhecido');
  END IF;

  INSERT INTO user_badges (user_id, badge_id, session_id)
  VALUES (v_user_id, p_badge_id, p_session_id);

  RETURN json_build_object('success', true, 'message', 'Badge concedido');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Erro ao processar badge');
END;
$function$;
