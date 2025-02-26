#!/usr/bin/env bash

if [[ -z "$1" ]]; then
  echo "Usage: $0 <post-name>"
  exit 1
fi

BLOG_DIR="./src/content/blog"
POST_DIR="$BLOG_DIR/$1"

mkdir -p "$POST_DIR" || {
  echo "Failed to create directory"
  exit 1
}

cat >"$POST_DIR/index.md" <<EOF
---
title: ""
description: ""
date: "$(date +'%Y-%m-%d')"
tags:
  - 
  - 
series: 
---
EOF

nvim "$POST_DIR/index.md"
