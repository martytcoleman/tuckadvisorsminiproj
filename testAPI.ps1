# Author: Marty Coleman
# Purpose: PowerShell testing script for the API (I'm on Windows, to run on Mac/Linux use the equivalent shell script as discussed in the README.md)
# Date: 02.13.25


# define API Base URL
$BASE_URL = "http://localhost:3000/api/analysis"

# test GET request Pre-POST
Write-Host "`nTesting GET request (Before POST)...`n"
$initialResponse = Invoke-RestMethod -Uri $BASE_URL -Method GET
Write-Host ($initialResponse | ConvertTo-Json -Depth 10)
# divider lines
Write-Host "`n--------------------------------------`n"

# define a new test sentence
$NEW_SENTENCE = "This is a test sentence from my PowerShell script; hello Tuck Advisors team."

# test the POST request
Write-Host "Testing POST request...`n"
$body = @{ newSentence = $NEW_SENTENCE } | ConvertTo-Json -Compress
$postResponse = Invoke-RestMethod -Uri $BASE_URL -Method POST -Body $body -ContentType "application/json"
Write-Host ($postResponse | ConvertTo-Json -Depth 10)
Write-Host "`n--------------------------------------`n"

# test GET request after POST to ensure persistence
Write-Host "Testing GET request (After POST)...`n"
$finalResponse = Invoke-RestMethod -Uri $BASE_URL -Method GET
Write-Host ($finalResponse | ConvertTo-Json -Depth 10)
Write-Host "`n--------------------------------------`n"

Write-Host "Test Completed"
