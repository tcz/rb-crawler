#!/bin/bash

servers=(
    "rb1	795000	825000	20241116-1"
    "rb2	825000	855000	20241116-2"
    "rb3	855000	885000	20241116-3"
    "rb4	885000	915000	20241116-4"
    "rb5	915000	945000	20241116-5"
    "rb6	945000	975000	20241116-6"
    "rb7	975000	1005000	20241116-7"
    "rb8	1005000	1035000	20241116-8"
    "rb9	1035000	1065000	20241116-9"
    "rb10	1065000	1095000	20241116-10"
)

# File content template with placeholders for dynamic values
file_content_template="rm -rf storage/datasets/default/
rm -rf storage/key_value_stores/default/
rm -rf storage/request_queues/default/

time while true; do AWS_PROFILE=personal CRAWLEE_PURGE_ON_START=0 CRAWLEE_MEMORY_MBYTES=50000 RUN_NAME={{RUN_NAME}} RUN_INTERVAL_FROM={{RUN_INTERVAL_FROM}} RUN_INTERVAL_TO={{RUN_INTERVAL_TO}} REDUCE_MARKUP_SIZE_TO=8000 node index.js 2>&1 | tee -a log.txt; sleep 10; done
"

for server_info in "${servers[@]}"; do
    # Parse the server information
    set -- $server_info
    server=$1
    FROM=$2
    TO=$3
    RUN_NAME=$4

    # Replace placeholders in the file content template with server-specific values
    file_content="${file_content_template//\{\{RUN_NAME\}\}/$RUN_NAME}"
    file_content="${file_content//\{\{RUN_INTERVAL_FROM\}\}/$FROM}"
    file_content="${file_content//\{\{RUN_INTERVAL_TO\}\}/$TO}"

    # Use SSH to connect to the server and write the file content to the specified location
    ssh root@"$server" "echo \"$file_content\" > /root/Crawler/bin/run_long_crawl && chmod +x /root/Crawler/bin/run_long_crawl"

    # Display status
    if [ $? -eq 0 ]; then
        echo "Successfully updated run_long_crawl on $server"
    else
        echo "Failed to update run_long_crawl on $server"
    fi
done