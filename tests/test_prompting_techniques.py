from prompting import techniques, client


def test_get_all_techniques_and_run(monkeypatch) -> None:
    # Ensure mock mode for client
    monkeypatch.delenv('LLM_API_KEY', raising=False)
    monkeypatch.delenv('GROK_API_KEY', raising=False)

    llm = client.LLMClient()
    techs = techniques.get_all_techniques(client=llm)
    assert isinstance(techs, dict)
    assert 'role_task_constraints' in techs

    evidence = {"known_taxa": [["SARS-CoV-2", 0.75]], "ood_rate": 0.02}
    rt = techs['role_task_constraints']
    res = rt.run(evidence)

    assert 'json' in res
    assert isinstance(res['json'], dict)
    assert 'summary' in res['json']


def test_critique_and_revise_helpers(monkeypatch) -> None:
    monkeypatch.delenv('LLM_API_KEY', raising=False)
    monkeypatch.delenv('GROK_API_KEY', raising=False)

    llm = client.LLMClient()
    cr = techniques.CritiqueAndRevise(client=llm)
    # Build initial and critique messages
    init = cr._build_initial_messages({"known_taxa": [["X", 0.1]], "ood_rate": 0.5})
    assert isinstance(init, list) and init[0]['role'] == 'user'

    critique = cr._build_critique_messages('initial analysis text', {})
    assert isinstance(critique, list) and 'Reviewer critique' in critique[0]['content']


def test_self_consistency_with_invalid_base() -> None:
    # Create a base technique that always returns invalid PromptResult
    class FakeBase:
        def __init__(self):
            self.name = 'fake'
        def run(self, evidence, temperature=0.3):
            return {'valid': False, 'json': {}, 'latency_s': 0}

    sc = techniques.SelfConsistency(base_technique=FakeBase(), n_samples=2, client=None)
    res = sc.run({})
    assert res['valid'] is True
    assert 'Inconclusive' in res['json']['summary'] or 'Consensus failed' in res['errors'][0]
