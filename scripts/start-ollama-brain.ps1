Write-Host 'Starting UAOS Local AI Brain...'

ollama --version

Write-Host 'Pulling Llama model...'
ollama pull llama3.2

Write-Host 'Testing UAOS AI prompt...'
ollama run llama3.2 'You are UAOS. Explain Universal Arranger OS in one short launch message.'

Write-Host 'UAOS Ollama brain ready.'
