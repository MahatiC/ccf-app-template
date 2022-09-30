#!/bin/bash

# Run prepare_demo.sh in another terminal before running this script


cd workspace/sandbox_common
cp ../../certs_for_demo/* ./
cp ../../vote/* ./

user0_id=$(openssl x509 -in "user0_cert.pem" -noout -fingerprint -sha256 | cut -d "=" -f 2 | sed 's/://g' | awk '{print tolower($0)}')
user1_id=$(openssl x509 -in "user1_cert.pem" -noout -fingerprint -sha256 | cut -d "=" -f 2 | sed 's/://g' | awk '{print tolower($0)}')

set -x

# Add users

# Proposal for user0
proposal0_out=$(/opt/ccf/bin/scurl.sh https://127.0.0.1:8000/gov/proposals --cacert service_cert.pem --signing-key member0_privk.pem --signing-cert member0_cert.pem --data-binary @set_user0.json -H "content-type: application/json")
proposal0_id=$( jq -r  '.proposal_id' <<< "${proposal0_out}" )
echo $proposal0_id

# Vote by member 1
/opt/ccf/bin/scurl.sh https://127.0.0.1:8000/gov/proposals/$proposal0_id/ballots --cacert service_cert.pem --signing-key member1_privk.pem --signing-cert member1_cert.pem --data-binary @vote_accept.json -H "content-type: application/json" | jq
# Vote by member 2
/opt/ccf/bin/scurl.sh https://127.0.0.1:8000/gov/proposals/$proposal0_id/ballots --cacert service_cert.pem --signing-key member2_privk.pem --signing-cert member2_cert.pem --data-binary @vote_accept.json -H "content-type: application/json" | jq

# Proposal for user1
proposal1_out=$(/opt/ccf/bin/scurl.sh https://127.0.0.1:8000/gov/proposals --cacert service_cert.pem --signing-key member0_privk.pem --signing-cert member0_cert.pem --data-binary @set_user1.json -H "content-type: application/json")
proposal1_id=$( jq -r  '.proposal_id' <<< "${proposal1_out}" )
echo $proposal0_id

# Vote by member 1
/opt/ccf/bin/scurl.sh https://127.0.0.1:8000/gov/proposals/$proposal1_id/ballots --cacert service_cert.pem --signing-key member1_privk.pem --signing-cert member1_cert.pem --data-binary @vote_accept.json -H "content-type: application/json" | jq
# Vote by member 2
/opt/ccf/bin/scurl.sh https://127.0.0.1:8000/gov/proposals/$proposal1_id/ballots --cacert service_cert.pem --signing-key member2_privk.pem --signing-cert member2_cert.pem --data-binary @vote_accept.json -H "content-type: application/json" | jq

# Deposit: user0, 100
curl https://127.0.0.1:8000/app/deposit/$user0_id -X POST --cacert service_cert.pem --cert member0_cert.pem --key member0_privk.pem -H "Content-Type: application/json" --data-binary '{ "value": 100}'

# Transfer 40 from user0 to user1
curl https://127.0.0.1:8000/app/transfer/$user1_id -X POST --cacert service_cert.pem --cert user0_cert.pem --key user0_privk.pem -H "Content-Type: application/json" --data-binary '{ "value": 40}'

# Check balance
curl https://127.0.0.1:8000/app/balance -X GET --cacert service_cert.pem --cert user0_cert.pem --key user0_privk.pem

curl https://127.0.0.1:8000/app/balance -X GET --cacert service_cert.pem --cert user1_cert.pem --key user1_privk.pem

curl https://127.0.0.1:8000/app/get_receipt/$user1_id -X POST --cacert service_cert.pem --cert user0_cert.pem --key user0_privk.pem

