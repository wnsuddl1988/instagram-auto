# 황소 23편 s8 — 오류 원인 좁히기용 최소 프롬프트

s8만 "죄송합니다. 동영상을 생성할 수 없습니다"가 반복돼 원인을 좁히는 시험용입니다. 순서대로 하나씩 시도하고, 처음 통과한 조합을 쓰세요(실패하면 환불됩니다).

## 시험 순서
1. **s7(통과했던 씬)을 같은 화면에서 다시 한 번** 돌려 본다 → 이것도 실패하면 s8이 아니라 서비스 쪽(한도·일시 장애)입니다.
2. 이미지 `bull_ep23_s8_v2_target_hall.png` + 아래 최소 프롬프트.
3. 이미지 `bull_ep23_s8.png`(카드 "컨센서스 / 영업이익 108조대") + 아래 최소 프롬프트.
4. 2·3이 통과하면 거기에 원래 긴 프롬프트의 문장을 하나씩 더해 본다(어느 문장이 원인인지 확인).

## 최소 프롬프트(카드 글자를 따로 적지 않음)
```
Animate this image into an 8-second video. The camera stays completely still for the whole clip. The gold bull mascot holds the card steadily in both hands at chest height and gives small friendly nods, blinks and breathes gently. He speaks naturally from 0.0s to 4.4s, then closes his mouth in a soft smile and stays quiet for the rest of the clip. Keep the card text and the background unchanged.
```
