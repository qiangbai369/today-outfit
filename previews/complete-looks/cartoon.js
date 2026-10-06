(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CompleteLookCartoon = factory();
})(globalThis, function () {
  'use strict';
  const ACTIONS = {
    sweet: [{ id: 'heart', name: '比心' }, { id: 'pout', name: '嘟嘴' }, { id: 'squint', name: '眯眼笑' }],
    cool: [{ id: 'brow', name: '挑眉' }, { id: 'smirk', name: '斜嘴笑' }, { id: 'peace', name: '比耶' }],
    literary: [{ id: 'check', name: '脸旁比勾' }, { id: 'wave', name: '轻挥手' }, { id: 'wink', name: '单眼 Wink' }]
  };
  // The original 24 complete looks remain intact. These three are the first action samples.
  const SAMPLES = {
    'sweet-autumn-b': { cartoon: 'assets/cartoon-v1/sweet-autumn-b.png', poses: {
      heart: 'assets/actions-v1/sweet-heart.png', pout: 'assets/actions-v1/sweet-pout.png', squint: 'assets/actions-v1/sweet-squint.png'
    } },
    'cool-autumn-a': { cartoon: 'assets/cartoon-v1/cool-autumn-a.png', poses: {
      brow: 'assets/actions-v1/cool-brow.png', smirk: 'assets/actions-v1/cool-smirk.png', peace: 'assets/actions-v1/cool-peace.png'
    } },
    'literary-autumn-a': { cartoon: 'assets/cartoon-v1/literary-autumn-a.png', poses: {
      check: 'assets/actions-v1/literary-check.png', wink: 'assets/actions-v1/literary-wink.png',
      ponytail: { base: 'assets/actions-v1/literary-ponytail-base.png', layer: 'assets/actions-v1/literary-ponytail-layer.png', pivot: [605, 125] }
    } }
  };
  // Reviewed whole figures extend the existing gallery without touching the originals.
  for (const character of Object.keys(ACTIONS)) {
    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
      for (const variant of ['a', 'b']) {
        const id = `${character}-${season}-${variant}`;
        if (!SAMPLES[id]) SAMPLES[id] = { cartoon: `assets/cartoon-v2/${id}.png`, poses: {} };
      }
    }
  }
  SAMPLES['literary-autumn-a'].poses.wave = {
    image: 'assets/actions-v2/literary-autumn-a-wave.png',
    pivot: [295, 537],
    hand: [[189, 347], [318, 355], [371, 427], [352, 510], [324, 542], [265, 542], [189, 484]]
  };
  // BEGIN reviewed v2 actions
  SAMPLES["cool-autumn-b"].poses["brow"] = "assets/actions-v2/cool-autumn-b-brow.png";
  SAMPLES["cool-autumn-b"].poses["peace"] = "assets/actions-v2/cool-autumn-b-peace.png";
  SAMPLES["cool-autumn-b"].poses["smirk"] = "assets/actions-v2/cool-autumn-b-smirk.png";
  SAMPLES["cool-spring-a"].poses["brow"] = "assets/actions-v2/cool-spring-a-brow.png";
  SAMPLES["cool-spring-a"].poses["peace"] = "assets/actions-v2/cool-spring-a-peace.png";
  SAMPLES["cool-spring-a"].poses["smirk"] = "assets/actions-v2/cool-spring-a-smirk.png";
  SAMPLES["cool-spring-b"].poses["brow"] = "assets/actions-v2/cool-spring-b-brow.png";
  SAMPLES["cool-spring-b"].poses["peace"] = "assets/actions-v2/cool-spring-b-peace.png";
  SAMPLES["cool-spring-b"].poses["smirk"] = "assets/actions-v2/cool-spring-b-smirk.png";
  SAMPLES["cool-summer-a"].poses["brow"] = "assets/actions-v2/cool-summer-a-brow.png";
  SAMPLES["cool-summer-a"].poses["peace"] = "assets/actions-v2/cool-summer-a-peace.png";
  SAMPLES["cool-summer-a"].poses["smirk"] = "assets/actions-v2/cool-summer-a-smirk.png";
  SAMPLES["cool-summer-b"].poses["brow"] = "assets/actions-v2/cool-summer-b-brow.png";
  SAMPLES["cool-summer-b"].poses["peace"] = "assets/actions-v2/cool-summer-b-peace.png";
  SAMPLES["cool-summer-b"].poses["smirk"] = "assets/actions-v2/cool-summer-b-smirk.png";
  SAMPLES["cool-winter-a"].poses["brow"] = "assets/actions-v2/cool-winter-a-brow.png";
  SAMPLES["cool-winter-a"].poses["peace"] = "assets/actions-v2/cool-winter-a-peace.png";
  SAMPLES["cool-winter-a"].poses["smirk"] = "assets/actions-v2/cool-winter-a-smirk.png";
  SAMPLES["cool-winter-b"].poses["brow"] = "assets/actions-v2/cool-winter-b-brow.png";
  SAMPLES["cool-winter-b"].poses["peace"] = "assets/actions-v2/cool-winter-b-peace.png";
  SAMPLES["cool-winter-b"].poses["smirk"] = "assets/actions-v2/cool-winter-b-smirk.png";
  SAMPLES["literary-autumn-b"].poses["check"] = "assets/actions-v2/literary-autumn-b-check.png";
  SAMPLES["literary-autumn-b"].poses["wave"] = {"image":"assets/actions-v2/literary-autumn-b-wave.png","pivot":[281,532],"hand":[[186,354],[315,362],[363,427],[343,495],[311,537],[249,537],[186,468]]};
  SAMPLES["literary-autumn-b"].poses["wink"] = "assets/actions-v2/literary-autumn-b-wink.png";
  SAMPLES["literary-spring-a"].poses["check"] = "assets/actions-v2/literary-spring-a-check.png";
  SAMPLES["literary-spring-a"].poses["wave"] = {"image":"assets/actions-v2/literary-spring-a-wave.png","pivot":[289,544],"hand":[[187,359],[316,369],[362,430],[344,507],[313,548],[260,548],[187,468]]};
  SAMPLES["literary-spring-a"].poses["wink"] = "assets/actions-v2/literary-spring-a-wink.png";
  SAMPLES["literary-spring-b"].poses["check"] = "assets/actions-v2/literary-spring-b-check.png";
  SAMPLES["literary-spring-b"].poses["wave"] = {"image":"assets/actions-v2/literary-spring-b-wave.png","pivot":[290,546],"hand":[[186,354],[319,363],[362,424],[341,505],[316,550],[259,550],[186,468]]};
  SAMPLES["literary-spring-b"].poses["wink"] = "assets/actions-v2/literary-spring-b-wink.png";
  SAMPLES["literary-summer-a"].poses["check"] = "assets/actions-v2/literary-summer-a-check.png";
  SAMPLES["literary-summer-a"].poses["wave"] = {"image":"assets/actions-v2/literary-summer-a-wave.png","pivot":[296,554],"hand":[[203,389],[324,397],[369,467],[351,531],[319,557],[275,557],[203,488]]};
  SAMPLES["literary-summer-a"].poses["wink"] = "assets/actions-v2/literary-summer-a-wink.png";
  SAMPLES["literary-summer-b"].poses["check"] = "assets/actions-v2/literary-summer-b-check.png";
  SAMPLES["literary-summer-b"].poses["wave"] = {"image":"assets/actions-v2/literary-summer-b-wave.png","pivot":[283,540],"hand":[[182,370],[302,378],[346,435],[329,505],[306,543],[255,543],[182,474]]};
  SAMPLES["literary-summer-b"].poses["wink"] = "assets/actions-v2/literary-summer-b-wink.png";
  SAMPLES["literary-winter-a"].poses["check"] = "assets/actions-v2/literary-winter-a-check.png";
  SAMPLES["literary-winter-a"].poses["wave"] = {"image":"assets/actions-v2/literary-winter-a-wave.png","pivot":[263,541],"hand":[[174,372],[292,380],[340,446],[323,505],[292,546],[234,546],[174,470]]};
  SAMPLES["literary-winter-a"].poses["wink"] = "assets/actions-v2/literary-winter-a-wink.png";
  SAMPLES["literary-winter-b"].poses["check"] = "assets/actions-v2/literary-winter-b-check.png";
  SAMPLES["literary-winter-b"].poses["wave"] = {"image":"assets/actions-v2/literary-winter-b-wave.png","pivot":[283,532],"hand":[[189,363],[322,371],[360,439],[341,503],[313,537],[251,537],[189,472]]};
  SAMPLES["literary-winter-b"].poses["wink"] = "assets/actions-v2/literary-winter-b-wink.png";
  SAMPLES["sweet-autumn-a"].poses["heart"] = "assets/actions-v2/sweet-autumn-a-heart.png";
  SAMPLES["sweet-autumn-a"].poses["pout"] = "assets/actions-v2/sweet-autumn-a-pout.png";
  SAMPLES["sweet-autumn-a"].poses["squint"] = "assets/actions-v2/sweet-autumn-a-squint.png";
  SAMPLES["sweet-spring-a"].poses["heart"] = "assets/actions-v2/sweet-spring-a-heart.png";
  SAMPLES["sweet-spring-a"].poses["pout"] = "assets/actions-v2/sweet-spring-a-pout.png";
  SAMPLES["sweet-spring-a"].poses["squint"] = "assets/actions-v2/sweet-spring-a-squint.png";
  SAMPLES["sweet-spring-b"].poses["heart"] = "assets/actions-v2/sweet-spring-b-heart.png";
  SAMPLES["sweet-spring-b"].poses["pout"] = "assets/actions-v2/sweet-spring-b-pout.png";
  SAMPLES["sweet-spring-b"].poses["squint"] = "assets/actions-v2/sweet-spring-b-squint.png";
  SAMPLES["sweet-summer-a"].poses["heart"] = "assets/actions-v2/sweet-summer-a-heart.png";
  SAMPLES["sweet-summer-a"].poses["pout"] = "assets/actions-v2/sweet-summer-a-pout.png";
  SAMPLES["sweet-summer-a"].poses["squint"] = "assets/actions-v2/sweet-summer-a-squint.png";
  SAMPLES["sweet-summer-b"].poses["heart"] = "assets/actions-v2/sweet-summer-b-heart.png";
  SAMPLES["sweet-summer-b"].poses["pout"] = "assets/actions-v2/sweet-summer-b-pout.png";
  SAMPLES["sweet-summer-b"].poses["squint"] = "assets/actions-v2/sweet-summer-b-squint.png";
  SAMPLES["sweet-winter-a"].poses["heart"] = "assets/actions-v2/sweet-winter-a-heart.png";
  SAMPLES["sweet-winter-a"].poses["pout"] = "assets/actions-v2/sweet-winter-a-pout.png";
  SAMPLES["sweet-winter-a"].poses["squint"] = "assets/actions-v2/sweet-winter-a-squint.png";
  SAMPLES["sweet-winter-b"].poses["heart"] = "assets/actions-v2/sweet-winter-b-heart.png";
  SAMPLES["sweet-winter-b"].poses["pout"] = "assets/actions-v2/sweet-winter-b-pout.png";
  SAMPLES["sweet-winter-b"].poses["squint"] = "assets/actions-v2/sweet-winter-b-squint.png";
  // END reviewed v2 actions
  const REPRESENTATIVES = { sweet: 'sweet-autumn-b', cool: 'cool-autumn-a', literary: 'literary-autumn-a' };
  return { ACTIONS, SAMPLES, REPRESENTATIVES };
});
