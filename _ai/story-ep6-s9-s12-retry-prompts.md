# 스토리 6편 s9 · s12 — "오디오를 생성할 수 없습니다" 재시도용 프롬프트

두 씬 모두 얼굴 없이 손과 소품만 나오는 장면이라, 오류 문구("오디오를 생성할 수 없습니다")를 보면 **영상이 아니라 소리 생성**이 막힌 것으로 보입니다. 원래 프롬프트의 소리 지시("nobody speaks / no voice, no music / no talking …" 부정문이 여러 겹)를 빼고, **어떤 소리가 나는지를 긍정문으로** 적었습니다. 실패하면 환불됩니다. 순서대로 시도하세요.

## 시도 순서
1. **A안(소리를 긍정문으로 지정)** — 아래 A안을 그대로.
2. 안 되면 **B안(최소 프롬프트)** — ep23 s8이 이 방식으로 통과했습니다.

---

## s9 — A안 (8초)
```
Animate this image into an 8-second video clip. Keep the close view of the dealer's hand, the customer's hands, the car keys, the plain blank white booklet and the small plain gray sedan behind exactly as shown in the reference image.

CAMERA: the camera stays completely still for the whole clip, with the same framing from the first frame to the last.

MOTION: the dealer's hand places the keys and the plain booklet into the customer's cupped hands, and both hands gently close around them. The sedan and the showroom behind stay still.

SOUND: a soft quiet showroom room tone, the faint jingle of the car keys as they are handed over, and a light rustle of the booklet. No speech.

MOOD: a promise handed over.
```

## s9 — B안 (최소)
```
Animate this image into an 8-second video. The camera stays completely still. The dealer's hand places the car keys and the plain white booklet into the customer's cupped hands, and both hands gently close around them. Everything else stays unchanged. Soft showroom ambience with the faint jingle of keys.
```

---

## s12 — A안 (8초)
```
Animate this image into an 8-second video clip. Keep the bright office desk, the large horizontal ranking chart made of plain bars, the small plain gray car model near the top of the chart and the suited hand exactly as shown in the reference image.

CAMERA: the camera stays completely still for the whole clip, with the same framing from the first frame to the last.

MOTION: the suited hand lifts away from the car model near the top of the chart and gives a small satisfied tap on the table. The chart and the car model stay still.

SOUND: a quiet office room tone and one soft tap of the fingers on the wooden desk. No speech.

MOOD: climbing up.
```

## s12 — B안 (최소)
```
Animate this image into an 8-second video. The camera stays completely still. The suited hand lifts away from the small gray car model near the top of the chart and gives a small tap on the table. The chart and the model stay still. Quiet office ambience.
```
