"""Editorial V2 projected-layout guardrail checker (local Blender Python only).

Run: blender --background <scene.blend> --python scripts/editorial_v2/visual_guardrails.py
The scene supplies role mappings through the EDITORIAL_V2_GUARDRAILS_V1 JSON property.
"""
import fnmatch
import json
import os
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

CONFIG_KEY = "EDITORIAL_V2_GUARDRAILS_V1"


def normalized_ass_visible_text(value):
    """Remove ASS override markup before semantic text comparison."""
    import re
    return re.sub(r"\{[^}]*\}", "", value).replace("\\N", "\n")


def visible(obj):
    return obj is not None and not obj.hide_render


def resolve(names):
    resolved = []
    for name in names:
        if any(mark in name for mark in "*?["):
            resolved.extend(obj for obj in bpy.data.objects if fnmatch.fnmatch(obj.name, name))
        elif bpy.data.objects.get(name):
            resolved.append(bpy.data.objects[name])
    return resolved


def projected_bbox(scene, obj):
    if not visible(obj) or not scene.camera:
        return None
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    points = [evaluated.matrix_world @ Vector(corner) for corner in evaluated.bound_box]
    projected = [world_to_camera_view(scene, scene.camera, point) for point in points]
    return {
        "left": min(point.x for point in projected),
        "right": max(point.x for point in projected),
        "bottom": min(point.y for point in projected),
        "top": max(point.y for point in projected),
    }


def intersects(first, second):
    if first is None or second is None:
        return False
    return max(first["left"], second["left"]) < min(first["right"], second["right"]) and max(first["bottom"], second["bottom"]) < min(first["top"], second["top"])


def luminance(material):
    color = material.diffuse_color
    return 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]


def frame_range(config, scene):
    start, end = config.get("frames", [scene.frame_start, scene.frame_end])
    return range(int(start), int(end) + 1)


def check(scene, config):
    violations = {"mouth": [], "textArrow": [], "card": [], "safeFrame": [], "terminal": [], "semantic": [], "sceneLeakage": [], "criticalText": [], "typography": [], "glyphDeclaration": [], "subtitleLayer": [], "subtitleSafe": [], "subtitleCollision": [], "subtitleCharacter": [], "subtitleHand": [], "subtitleCriticalUi": [], "subtitleTextClipping": [], "subtitleReadabilityStyle": [], "dataOverlayFont": [], "dataOverlaySize": [], "dataOverlayCrispText": [], "dataOverlayContrast": [], "dataOverlayCollision": [], "dataOverlayCharacter": [], "explanatoryEmphasis": [], "backgroundEnrichment": []}
    safe = config["safeFrame"]
    mouth_states = {name: resolve(patterns) for name, patterns in config["mouthStates"].items()}
    safe_names = resolve(config.get("safeObjects", []))
    cards = [(pair[0], pair[1]) for pair in config.get("cardPairs", [])]
    text_symbols = [(pair[0], pair[1]) for pair in config.get("textSymbolPairs", [])]
    semantic_required = config.get("semanticRequired", {})
    forbidden_visible_prefixes = config.get("forbiddenVisiblePrefixes", [])
    critical_text = resolve(config.get("criticalText", []))
    foreground_exclusions = resolve(config.get("foregroundExclusions", []))
    typography_roles = config.get("typographyRoles", {})
    glyph_requirements = config.get("glyphRequirements", {})
    subtitle = config.get("subtitle", {})
    subtitle_phrases = subtitle.get("phrases", [])
    subtitle_safe = subtitle.get("safeFrame", safe)
    subtitle_ui_exclusions = resolve(subtitle.get("uiExclusions", []))
    subtitle_foreground_exclusions = resolve(subtitle.get("foregroundExclusions", []))
    subtitle_character_exclusions = resolve(subtitle.get("characterExclusions", []))
    subtitle_hand_exclusions = resolve(subtitle.get("handExclusions", []))
    subtitle_critical_ui_exclusions = resolve(subtitle.get("criticalUiExclusions", []))
    subtitle_readability = subtitle.get("readability", {})
    subtitle_screen_events = subtitle.get("screenEvents", [])
    subtitle_ass = subtitle.get("ass", {})
    data_overlay = config.get("dataOverlay", {})
    data_objects = resolve(data_overlay.get("textObjects", []))
    data_foreground_exclusions = resolve(data_overlay.get("foregroundExclusions", []))
    emphasis_requirements = config.get("explanatoryEmphasis", [])
    background_enrichment_required = config.get("backgroundEnrichmentRequired", [])

    for name, expected_body in semantic_required.items():
        obj = bpy.data.objects.get(name)
        actual_body = getattr(getattr(obj, "data", None), "body", None)
        if obj is None or actual_body != expected_body:
            violations["semantic"].append({"object": name, "expected": expected_body, "actual": actual_body})

    for name, expected_body in glyph_requirements.get("requiredBodies", {}).items():
        obj = bpy.data.objects.get(name)
        if obj is None or getattr(getattr(obj, "data", None), "body", None) != expected_body:
            violations["glyphDeclaration"].append({"object": name, "expected": expected_body, "actual": getattr(getattr(obj, "data", None), "body", None)})
        elif getattr(obj.data.font, "filepath", "") != glyph_requirements.get("fontPath"):
            violations["glyphDeclaration"].append({"object": name, "expectedFont": glyph_requirements.get("fontPath"), "actualFont": getattr(obj.data.font, "filepath", "")})

    for role, token in typography_roles.items():
        for name in token.get("textObjects", []):
            obj = bpy.data.objects.get(name)
            if obj is None or obj.type != "FONT":
                violations["typography"].append({"role": role, "object": name, "reason": "TEXT_OBJECT_MISSING"})
                continue
            if getattr(obj.data.font, "filepath", "") != token["fontPath"] or obj.data.align_x != token["align"] or abs(obj.data.size - token["size"]) > 0.0001 or not obj.data.materials or obj.data.materials[0].name != token["textMaterial"]:
                violations["typography"].append({"role": role, "object": name, "reason": "TEXT_TOKEN_MISMATCH"})
        for name in token.get("cardObjects", []):
            obj = bpy.data.objects.get(name)
            if obj is None or not obj.data.materials or obj.data.materials[0].name != token["cardMaterial"]:
                violations["typography"].append({"role": role, "object": name, "reason": "CARD_TOKEN_MISMATCH"})

    for requirement in emphasis_requirements:
        obj = bpy.data.objects.get(requirement["object"])
        if obj is None or obj.type != "FONT":
            violations["explanatoryEmphasis"].append({"object": requirement["object"], "reason": "TEXT_OBJECT_MISSING"})
            continue
        if obj.data.size + 0.0001 < requirement.get("minSize", 0.0):
            violations["explanatoryEmphasis"].append({"object": obj.name, "reason": "SIZE_BELOW_EMPHASIS_TIER", "actual": obj.data.size, "minimum": requirement.get("minSize")})
        expected_material = requirement.get("material")
        if expected_material and (not obj.data.materials or obj.data.materials[0].name != expected_material):
            violations["explanatoryEmphasis"].append({"object": obj.name, "reason": "EMPHASIS_MATERIAL_MISMATCH", "actual": obj.data.materials[0].name if obj.data.materials else None, "expected": expected_material})

    for name in background_enrichment_required:
        if bpy.data.objects.get(name) is None:
            violations["backgroundEnrichment"].append({"object": name, "reason": "BACKGROUND_ENRICHMENT_OBJECT_MISSING"})

    if subtitle_ass:
        try:
            with open(subtitle_ass["path"], "r", encoding="utf-8-sig") as handle:
                ass_text = handle.read()
            style = subtitle_ass["style"]
            expected_style = "Style: %s,%s,%s," % (style["name"], style["fontFamily"], style["fontSize"])
            if expected_style not in ass_text or ",%s,%s," % (style["borderStyle"], style["outlinePx"]) not in ass_text:
                violations["subtitleReadabilityStyle"].append({"reason": "ASS_STYLE_TOKEN_MISMATCH"})
            if not style.get("directSceneOverlay") or style.get("detachedSlab"):
                violations["subtitleReadabilityStyle"].append({"reason": "SUBTITLE_PRESENTATION_NOT_DIRECT_OVERLAY"})
            if not subtitle_screen_events:
                violations["subtitleLayer"].append({"reason": "DIRECT_ASS_SUBTITLE_EVENTS_MISSING"})
            for event in subtitle_screen_events:
                positioned = "\\pos(" in event.get("assOverride", "") or subtitle_ass.get("composition") == "CENTERED_LOWER_CAPTION"
                if event.get("lineCount", 1) > subtitle_ass.get("maxLines", 2) or not positioned:
                    violations["subtitleReadabilityStyle"].append({"event": event.get("id"), "reason": "ASS_EVENT_STYLE_OR_LINECOUNT_FAIL"})
                if event.get("text") not in normalized_ass_visible_text(ass_text):
                    violations["subtitleReadabilityStyle"].append({"event": event.get("id"), "reason": "ASS_EVENT_TEXT_MISSING"})
        except (OSError, KeyError):
            violations["subtitleReadabilityStyle"].append({"reason": "ASS_EVIDENCE_UNREADABLE"})

    for obj in data_objects:
        if obj.type != "FONT" or getattr(obj.data.font, "filepath", "") != data_overlay.get("fontPath"):
            violations["dataOverlayFont"].append({"object": obj.name, "reason": "FONT_TOKEN_MISMATCH"})
        if obj.data.size + 0.0001 < data_overlay.get("minSceneSize", 0.0):
            violations["dataOverlaySize"].append({"object": obj.name, "actual": obj.data.size, "minimum": data_overlay.get("minSceneSize")})
        max_extrude = data_overlay.get("maxTextExtrude")
        max_bevel = data_overlay.get("maxTextBevel")
        if max_extrude is not None and obj.data.extrude > float(max_extrude) + 0.0001:
            violations["dataOverlayCrispText"].append({"object": obj.name, "reason": "TEXT_EXTRUDE_EXCEEDS_CRISP_TOKEN", "actual": obj.data.extrude, "maximum": max_extrude})
        if max_bevel is not None and obj.data.bevel_depth > float(max_bevel) + 0.0001:
            violations["dataOverlayCrispText"].append({"object": obj.name, "reason": "TEXT_BEVEL_EXCEEDS_CRISP_TOKEN", "actual": obj.data.bevel_depth, "maximum": max_bevel})
    for pair in data_overlay.get("contrastPairs", []):
        text_obj = bpy.data.objects.get(pair["text"])
        panel_obj = bpy.data.objects.get(pair["panel"])
        if text_obj is None or panel_obj is None or not text_obj.data.materials or not panel_obj.data.materials or abs(luminance(text_obj.data.materials[0]) - luminance(panel_obj.data.materials[0])) < data_overlay.get("minLuminanceDelta", 0.0):
            violations["dataOverlayContrast"].append({"text": pair["text"], "panel": pair["panel"], "reason": "CONTRAST_BELOW_TOKEN"})

    for frame in frame_range(config, scene):
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        active_states = [name for name, objects in mouth_states.items() if objects and all(visible(obj) for obj in objects)]
        if len(active_states) != 1:
            violations["mouth"].append({"frame": frame, "states": active_states})
        for text_name, symbol_name in text_symbols:
            if intersects(projected_bbox(scene, bpy.data.objects.get(text_name)), projected_bbox(scene, bpy.data.objects.get(symbol_name))):
                violations["textArrow"].append({"frame": frame, "text": text_name, "symbol": symbol_name})
        for first_name, second_name in cards:
            if intersects(projected_bbox(scene, bpy.data.objects.get(first_name)), projected_bbox(scene, bpy.data.objects.get(second_name))):
                violations["card"].append({"frame": frame, "first": first_name, "second": second_name})
        for obj in safe_names:
            bbox = projected_bbox(scene, obj)
            if bbox and (bbox["left"] < safe["left"] or bbox["right"] > safe["right"] or bbox["bottom"] < safe["bottom"] or bbox["top"] > safe["top"]):
                violations["safeFrame"].append({"frame": frame, "object": obj.name, "bbox": bbox})
        for prefix in forbidden_visible_prefixes:
            leaked = [obj.name for obj in bpy.data.objects if obj.name.startswith(prefix) and visible(obj)]
            if leaked:
                violations["sceneLeakage"].append({"frame": frame, "prefix": prefix, "objects": leaked})
        for text_obj in critical_text:
            text_bbox = projected_bbox(scene, text_obj)
            for foreground_obj in foreground_exclusions:
                if intersects(text_bbox, projected_bbox(scene, foreground_obj)):
                    violations["criticalText"].append({"frame": frame, "text": text_obj.name, "foreground": foreground_obj.name})
        if subtitle_screen_events:
            active_screen_events = [event for event in subtitle_screen_events if int(event["start"]) <= frame <= int(event["end"])]
            if len(active_screen_events) > 1:
                violations["subtitleLayer"].append({"frame": frame, "expectedPhraseCount": len(active_screen_events), "reason": "SCREEN_EVENT_OVERLAP"})
            subtitle_entries = [(event["id"], event["bbox"]) for event in active_screen_events]
        else:
            expected_phrases = [phrase for phrase in subtitle_phrases if int(phrase["start"]) <= frame <= int(phrase["end"])]
            all_subtitle_objects = []
            for phrase in subtitle_phrases:
                all_subtitle_objects.extend(resolve(phrase["objects"]))
            expected_objects = []
            for phrase in expected_phrases:
                expected_objects.extend(resolve(phrase["objects"]))
            visible_subtitles = [obj for obj in all_subtitle_objects if visible(obj)]
            if subtitle_phrases and (len(expected_phrases) > 1 or {obj.name for obj in visible_subtitles} != {obj.name for obj in expected_objects}):
                violations["subtitleLayer"].append({"frame": frame, "expectedPhraseCount": len(expected_phrases), "visible": [obj.name for obj in visible_subtitles], "expected": [obj.name for obj in expected_objects]})
            subtitle_entries = [(obj.name, projected_bbox(scene, obj)) for obj in visible_subtitles]
        for subtitle_name, subtitle_bbox in subtitle_entries:
            if subtitle_bbox and (subtitle_bbox["left"] < subtitle_safe["left"] or subtitle_bbox["right"] > subtitle_safe["right"] or subtitle_bbox["bottom"] < subtitle_safe["bottom"] or subtitle_bbox["top"] > subtitle_safe["top"]):
                violations["subtitleSafe"].append({"frame": frame, "object": subtitle_name, "bbox": subtitle_bbox})
            for exclusion in subtitle_ui_exclusions + subtitle_foreground_exclusions:
                if intersects(subtitle_bbox, projected_bbox(scene, exclusion)):
                    violations["subtitleCollision"].append({"frame": frame, "subtitle": subtitle_name, "exclusion": exclusion.name})
            for exclusion in subtitle_character_exclusions:
                if intersects(subtitle_bbox, projected_bbox(scene, exclusion)):
                    violations["subtitleCharacter"].append({"frame": frame, "subtitle": subtitle_name, "exclusion": exclusion.name})
            for exclusion in subtitle_hand_exclusions:
                if intersects(subtitle_bbox, projected_bbox(scene, exclusion)):
                    violations["subtitleHand"].append({"frame": frame, "subtitle": subtitle_name, "exclusion": exclusion.name})
            for exclusion in subtitle_critical_ui_exclusions:
                if intersects(subtitle_bbox, projected_bbox(scene, exclusion)):
                    violations["subtitleCriticalUi"].append({"frame": frame, "subtitle": subtitle_name, "exclusion": exclusion.name})

        for index, first in enumerate(data_objects):
            for second in data_objects[index + 1:]:
                if intersects(projected_bbox(scene, first), projected_bbox(scene, second)):
                    violations["dataOverlayCollision"].append({"frame": frame, "first": first.name, "second": second.name})
            for foreground in data_foreground_exclusions:
                if intersects(projected_bbox(scene, first), projected_bbox(scene, foreground)):
                    violations["dataOverlayCharacter"].append({"frame": frame, "text": first.name, "foreground": foreground.name})

        for group in subtitle_readability.get("groups", []):
            if not any(visible(bpy.data.objects.get(name)) for name in group.get("lines", [])):
                continue
            panel_bbox = projected_bbox(scene, bpy.data.objects.get(group["panel"]))
            lines = group.get("lines", [])
            if len(lines) > subtitle_readability.get("maxLines", 2):
                violations["subtitleReadabilityStyle"].append({"group": group["panel"], "reason": "MAX_LINES_EXCEEDED", "actual": len(lines)})
            for name in lines:
                line = bpy.data.objects.get(name)
                line_bbox = projected_bbox(scene, line)
                if line is None or line.type != "FONT" or line.data.size + 0.0001 < subtitle_readability.get("minFontSize", 0.0) or (subtitle_readability.get("fontPath") and getattr(line.data.font, "filepath", "") != subtitle_readability["fontPath"]):
                    violations["subtitleReadabilityStyle"].append({"group": group["panel"], "object": name, "reason": "STYLE_TIER_FAIL"})
                if line_bbox is None or panel_bbox is None or line_bbox["left"] < panel_bbox["left"] or line_bbox["right"] > panel_bbox["right"] or line_bbox["bottom"] < panel_bbox["bottom"] or line_bbox["top"] > panel_bbox["top"]:
                    violations["subtitleTextClipping"].append({"frame": frame, "panel": group["panel"], "line": name})

    terminal = config["terminal"]
    prior, final = int(terminal["priorFrame"]), int(terminal["finalFrame"])
    scene.frame_set(prior)
    prior_required = {name: visible(bpy.data.objects.get(name)) for name in terminal["required"]}
    prior_obsolete = {name: visible(bpy.data.objects.get(name)) for name in terminal["obsolete"]}
    scene.frame_set(final)
    final_required = {name: visible(bpy.data.objects.get(name)) for name in terminal["required"]}
    final_obsolete = {name: visible(bpy.data.objects.get(name)) for name in terminal["obsolete"]}
    if not all(prior_required.values()) or not all(final_required.values()) or any(prior_obsolete.values()) or any(final_obsolete.values()) or prior_required != final_required or prior_obsolete != final_obsolete:
        violations["terminal"].append({"prior": prior, "final": final, "priorRequired": prior_required, "finalRequired": final_required, "priorObsolete": prior_obsolete, "finalObsolete": final_obsolete})

    checks = {
        "MOUTH_STATE_COUNT": "PASS" if not violations["mouth"] else "FAIL",
        "TEXT_ARROW_OVERLAP": 0 if not violations["textArrow"] else len(violations["textArrow"]),
        "CARD_CARD_OVERLAP": 0 if not violations["card"] else len(violations["card"]),
        "SAFE_FRAME_BOUNDS": "PASS" if not violations["safeFrame"] else "FAIL",
        "FINAL_F179_F180_CONSISTENCY": "PASS" if not violations["terminal"] else "FAIL",
        "SEMANTIC_OBJECTS": "PASS" if not violations["semantic"] else "FAIL",
        "FORBIDDEN_SCENE_LEAKAGE": "PASS" if not violations["sceneLeakage"] else "FAIL",
        "CRITICAL_TEXT_CHARACTER_OCCLUSION": 0 if not violations["criticalText"] else len(violations["criticalText"]),
        "TYPOGRAPHY_ROLE_CONSISTENCY": "PASS" if not violations["typography"] else "FAIL",
        "GLYPH_DECLARATION": "PASS" if not violations["glyphDeclaration"] else "FAIL",
        "SUBTITLE_LAYER_PRESENT": "PASS" if not violations["subtitleLayer"] else "FAIL",
        "SUBTITLE_SAFE_REGION": "PASS" if not violations["subtitleSafe"] else "FAIL",
        "SUBTITLE_UI_COLLISION": 0 if not violations["subtitleCollision"] else len(violations["subtitleCollision"]),
        "SUBTITLE_CHARACTER_COLLISION": 0 if not violations["subtitleCharacter"] else len(violations["subtitleCharacter"]),
        "SUBTITLE_HAND_COLLISION": 0 if not violations["subtitleHand"] else len(violations["subtitleHand"]),
        "SUBTITLE_CRITICAL_UI_COLLISION": 0 if not violations["subtitleCriticalUi"] else len(violations["subtitleCriticalUi"]),
        "SUBTITLE_TEXT_CLIPPING": 0 if not violations["subtitleTextClipping"] else len(violations["subtitleTextClipping"]),
        "SUBTITLE_READABILITY_STYLE": "PASS" if not violations["subtitleReadabilityStyle"] else "FAIL",
        "DATA_OVERLAY_FONT_TOKEN": "PASS" if not violations["dataOverlayFont"] else "FAIL",
        "DATA_OVERLAY_MIN_SIZE_TIER": "PASS" if not violations["dataOverlaySize"] else "FAIL",
        "DATA_OVERLAY_CRISP_TEXT": "PASS" if not violations["dataOverlayCrispText"] else "FAIL",
        "DATA_OVERLAY_CONTRAST_CHECK": "PASS" if not violations["dataOverlayContrast"] else "FAIL",
        "DATA_OVERLAY_COLLISION": 0 if not violations["dataOverlayCollision"] else len(violations["dataOverlayCollision"]),
        "DATA_OVERLAY_CHARACTER_OCCLUSION": 0 if not violations["dataOverlayCharacter"] else len(violations["dataOverlayCharacter"]),
        "EXPLANATORY_TEXT_EMPHASIS": "PASS" if not violations["explanatoryEmphasis"] else "FAIL",
        "BACKGROUND_ENRICHMENT": "PASS" if not violations["backgroundEnrichment"] else "FAIL",
    }
    return {"scene": scene.name, "checker": "EDITORIAL_V2_GUARDRAILS_V1", "checks": checks, "violations": violations, "overall": "PASS" if all(value in ("PASS", 0) for value in checks.values()) else "FAIL"}


def main():
    scene = bpy.context.scene
    raw = scene.get(CONFIG_KEY)
    if not raw:
        raise RuntimeError("EDITORIAL_V2_GUARDRAIL_CONFIG_MISSING")
    config = json.loads(raw)
    if config.get("schema") != "EDITORIAL_V2_GUARDRAILS_V1":
        raise RuntimeError("EDITORIAL_V2_GUARDRAIL_CONFIG_SCHEMA_INVALID")
    result = check(scene, config)
    print("EDITORIAL_V2_GUARDRAIL_RESULT=" + json.dumps(result, ensure_ascii=False, sort_keys=True))
    if result["overall"] != "PASS":
        raise SystemExit(1)


main()
