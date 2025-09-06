#!/bin/bash

# Update Static Album Data
# Run this script when RSS feeds have been updated

echo "🚀 Updating static album data..."

# Ensure static directory exists
mkdir -p "data/static"

# Fetch current album data and save as static file
echo "📡 Fetching current album data..."
curl -s "http://localhost:3000/api/albums-no-db" > "data/static/albums.json"

if [ $? -eq 0 ]; then
    echo "✅ Successfully updated static album data"
    echo "📊 File size: $(ls -lh data/static/albums.json | awk '{print $5}')"
    echo "📅 Updated: $(date)"
else
    echo "❌ Failed to update static album data"
    exit 1
fi

echo ""
echo "🎉 Static data update complete!"
echo "💡 The app will now load much faster using the cached data."
echo ""
echo "📝 To update again in the future:"
echo "   ./scripts/update-static-data.sh"