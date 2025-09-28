#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Update registry.json with correct author information
"""

import os
import json
from datetime import datetime
from pathlib import Path

def update_registry():
    """Update registry.json with wshobson as author"""
    
    # Read current registry
    with open("registry.json", 'r', encoding='utf-8') as f:
        registry = json.load(f)
    
    # Update all agents to have wshobson as author
    for agent_id, agent_data in registry["agents"].items():
        agent_data["author"] = "wshobson"
    
    # Update metadata files
    agents_dir = Path("agents/wshobson")
    if agents_dir.exists():
        for agent_dir in agents_dir.iterdir():
            if agent_dir.is_dir():
                metadata_file = agent_dir / "metadata.json"
                if metadata_file.exists():
                    with open(metadata_file, 'r', encoding='utf-8') as f:
                        metadata = json.load(f)
                    
                    metadata["author"] = "wshobson"
                    metadata["homepage"] = "https://github.com/wshobson/agents"
                    
                    with open(metadata_file, 'w', encoding='utf-8') as f:
                        json.dump(metadata, f, indent=2, ensure_ascii=False)
                    
                    print(f"Updated metadata for {agent_dir.name}")
    
    # Update registry timestamp
    registry["lastUpdated"] = datetime.now().isoformat() + "Z"
    
    # Save updated registry
    with open("registry.json", 'w', encoding='utf-8') as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)
    
    print(f"Registry updated with {len(registry['agents'])} agents")
    print("All agents now attributed to wshobson")

if __name__ == "__main__":
    update_registry()
