export interface IntensityStyle {
  color: string;
  backgroundColor: string;
  borderColor: string;
}

//5弱-->5-
export function formatShindoDisplay(shindo: string): string {
  const shindoMap: Record<string, string> = {
    '5弱': '5-',
    '5強': '5+',
    '6弱': '6-',
    '6強': '6+',
  };
  return shindoMap[shindo] || shindo;
}

const shindoLightStyles: Record<string, IntensityStyle> = {
  '7':    { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(189, 17, 149, 1)',  borderColor: 'rgba(255, 118, 209, 1)' },
  '6強':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(250, 27, 75, 1)',   borderColor: 'rgb(255, 0, 55)' },
  '6弱':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(255, 61, 61, 0.57)', borderColor: 'rgba(255, 116, 116, 1)' },
  '5強':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(232, 118, 5, 1)',  borderColor: 'rgba(170, 86, 2, 1)' },
  '5弱':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(255, 196, 18, 1)', borderColor: 'rgba(146, 110, 0, 1)' },
  '4':    { color: 'rgb(0, 0, 0)',           backgroundColor: 'rgba(255, 255, 64, 0.82)', borderColor: 'rgba(199, 199, 35, 1)' },
  '3':    { color: 'rgba(0, 0, 0, 1)', backgroundColor: 'rgba(0, 255, 132, 0.3)',   borderColor: 'rgb(0, 255, 132)' },
  '2':    { color: 'rgba(0, 0, 0, 1)',       backgroundColor: 'rgba(0, 191, 255, 0.3)',   borderColor: 'rgb(0, 191, 255)' },
  '1':    { color: 'rgba(0, 0, 0, 1)',       backgroundColor: 'rgba(150, 245, 255, 0.3)', borderColor: 'rgb(150, 244, 255)' },
  '0':    { color: 'rgba(0, 0, 0, 1)',       backgroundColor: 'rgba(255, 255, 255, 0.3)', borderColor: 'rgba(232, 232, 232, 1)' },
};

const shindoDarkStyles: Record<string, IntensityStyle> = {
   '7':    { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(189, 17, 149, 1)',  borderColor: 'rgba(255, 118, 209, 1)' },
  '6強':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(250, 27, 75, 1)',   borderColor: 'rgb(255, 0, 55)' },
  '6弱':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(255, 61, 61, 0.57)', borderColor: 'rgba(255, 116, 116, 1)' },
  '5強':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(232, 118, 5, 1)',  borderColor: 'rgba(170, 86, 2, 1)' },
  '5弱':  { color: 'rgba(0, 0, 0, 1)', backgroundColor: 'rgba(255, 196, 18, 1)', borderColor: 'rgba(146, 110, 0, 1)' },
  '4':    { color: 'rgb(0, 0, 0)',           backgroundColor: 'rgba(255, 255, 64, 0.82)', borderColor: 'rgba(199, 199, 35, 1)' },
  '3':    { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(0, 255, 132, 0.3)',   borderColor: 'rgb(0, 255, 132)' },
  '2':    { color: 'rgba(255, 255, 255, 1)',       backgroundColor: 'rgba(0, 191, 255, 0.3)',   borderColor: 'rgb(0, 191, 255)' },
  '1':    { color: 'rgba(255, 255, 255, 1)',       backgroundColor: 'rgba(150, 245, 255, 0.3)', borderColor: 'rgb(150, 244, 255)' },
  '0':    { color: 'rgba(255, 255, 255, 1)',       backgroundColor: 'rgba(255, 255, 255, 0.3)', borderColor: 'rgba(232, 232, 232, 1)' },
};

export function getShindoStyle(shindo: string, isDark: boolean): IntensityStyle {
  const styles = isDark ? shindoDarkStyles : shindoLightStyles;
  return styles[shindo] || styles['0'];
}

const intensityLightStyles: Record<string, IntensityStyle> = {
  '12': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(189, 17, 149, 1)',  borderColor: 'rgba(255, 118, 209, 1)' },
  '11': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(94, 0, 144, 0.55)',  borderColor: 'rgba(188, 63, 255, 1)' },
  '10': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(250, 27, 75, 1)',   borderColor: 'rgb(255, 0, 55)' },
  '9':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(255, 61, 61, 0.57)', borderColor: 'rgba(255, 116, 116, 1)' },
  '8':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(232, 118, 5, 1)',  borderColor: 'rgba(170, 86, 2, 1)' },
  '7':  { color: 'rgba(0, 0, 0, 1)', backgroundColor: 'rgba(255, 196, 18, 1)', borderColor: 'rgba(146, 110, 0, 1)' },
  '6':  { color: 'rgba(0, 0, 0, 1)', backgroundColor: 'rgba(255, 222, 74, 0.51)', borderColor: 'rgb(225, 199, 85)' },
  '5':  { color: 'rgba(0, 0, 0, 1)', backgroundColor: 'rgba(44, 255, 125, 0.55)', borderColor: 'rgb(55, 226, 120)' },
  '4':  { color: 'rgba(0, 0, 0, 1)', backgroundColor: 'rgba(145, 255, 187, 0.5)',  borderColor: 'rgb(49, 163, 93)' },
  '3':  { color: 'rgba(0, 0, 0, 1)',       backgroundColor: 'rgba(90, 239, 255, 0.45)', borderColor: 'rgb(150, 244, 255)' },
  '2':  { color: 'rgba(0, 0, 0, 1)',       backgroundColor: 'rgba(150, 245, 255, 0.3)', borderColor: 'rgb(150, 244, 255)' },
  '1':  { color: 'rgba(0, 0, 0, 1)',       backgroundColor: 'rgba(255, 255, 255, 0.3)', borderColor: 'rgba(232, 232, 232, 1)' },
  '0':  { color: 'rgba(0, 0, 0, 1)',       backgroundColor: 'rgba(255, 255, 255, 0.3)', borderColor: 'rgba(232, 232, 232, 1)' },
};

const intensityDarkStyles: Record<string, IntensityStyle> = {
  '12': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(189, 17, 149, 1)',  borderColor: 'rgba(255, 118, 209, 1)' },
  '11': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(94, 0, 144, 0.55)',  borderColor: 'rgba(188, 63, 255, 1)' },
  '10': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(250, 27, 75, 1)',   borderColor: 'rgb(255, 0, 55)' },
  '9':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(255, 61, 61, 0.57)', borderColor: 'rgba(255, 116, 116, 1)' },
  '8':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(232, 118, 5, 1)',  borderColor: 'rgba(170, 86, 2, 1)' },
  '7':  { color: 'rgba(0, 0, 0, 1)', backgroundColor: 'rgba(255, 196, 18, 1)', borderColor: 'rgba(146, 110, 0, 1)' },
  '6':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(255, 222, 74, 0.51)', borderColor: 'rgb(225, 199, 85)' },
  '5':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(44, 255, 125, 0.55)', borderColor: 'rgb(55, 226, 120)' },
  '4':  { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(145, 255, 187, 0.5)',  borderColor: 'rgb(49, 163, 93)' },
  '3':  { color: 'rgba(255, 255, 255, 1)',       backgroundColor: 'rgba(90, 239, 255, 0.45)', borderColor: 'rgb(150, 244, 255)' },
  '2':  { color: 'rgba(255, 255, 255, 1)',       backgroundColor: 'rgba(150, 245, 255, 0.3)', borderColor: 'rgb(150, 244, 255)' },
  '1':  { color: 'rgba(255, 255, 255, 1)',       backgroundColor: 'rgba(255, 255, 255, 0.3)', borderColor: 'rgba(232, 232, 232, 1)' },
  '0':  { color: 'rgba(255, 255, 255, 1)',       backgroundColor: 'rgba(255, 255, 255, 0.3)', borderColor: 'rgba(232, 232, 232, 1)' },
};

export function getIntensityStyle(intensity: string, isDark: boolean): IntensityStyle {
  const styles = isDark ? intensityDarkStyles : intensityLightStyles;
  return styles[intensity] || styles['0'];
}

const lpgmLightStyles: Record<string, IntensityStyle> = {
  '4': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(94, 0, 144, 0.55)',  borderColor: 'rgba(188, 63, 255, 1)' },
  '3': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(232, 118, 5, 1)',  borderColor: 'rgba(170, 86, 2, 1)' },
  '2': { color: 'rgba(0, 0, 0, 1)', backgroundColor: 'rgba(255, 222, 74, 0.51)', borderColor: 'rgb(225, 199, 85)' },
  '1': { color: 'rgba(0, 0, 0, 1)', backgroundColor: 'rgba(145, 255, 187, 0.5)',  borderColor: 'rgb(49, 163, 93)' },
  '0': { color: 'rgba(0, 0, 0, 1)',       backgroundColor: 'rgba(255, 255, 255, 0.3)', borderColor: 'rgba(232, 232, 232, 1)' },
};

const lpgmDarkStyles: Record<string, IntensityStyle> = {
  '4': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(94, 0, 144, 0.55)',  borderColor: 'rgba(188, 63, 255, 1)' },
  '3': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(232, 118, 5, 1)',  borderColor: 'rgba(170, 86, 2, 1)' },
  '2': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(255, 222, 74, 0.51)', borderColor: 'rgb(225, 199, 85)' },
  '1': { color: 'rgba(255, 255, 255, 1)', backgroundColor: 'rgba(145, 255, 187, 0.5)',  borderColor: 'rgb(49, 163, 93)' },
  '0': { color: 'rgba(255, 255, 255, 1)',       backgroundColor: 'rgba(255, 255, 255, 0.3)', borderColor: 'rgba(232, 232, 232, 1)' },
};

export function getLPGMStyle(lpgm: string, isDark: boolean): IntensityStyle {
  const styles = isDark ? lpgmDarkStyles : lpgmLightStyles;
  return styles[lpgm] || styles['0'];
}
