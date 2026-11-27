import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// Lingua mascots: shaded vector characters (viewBox 200 x 230)
export function Girl({ size = 130 }) {
  return (
    <Svg width={size} height={(size * 230) / 200} viewBox="0 0 200 230">
      
        <Defs>
          <RadialGradient id="g_skin" cx="45%" cy="38%" r="70%">
            <Stop offset="0" stopColor="#FFE3CC"/><Stop offset="0.7" stopColor="#F8C29E"/><Stop offset="1" stopColor="#ECA67F"/>
          </RadialGradient>
          <LinearGradient id="g_hair" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#6E4029"/><Stop offset="1" stopColor="#3D2216"/>
          </LinearGradient>
          <LinearGradient id="g_sweater" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFD866"/><Stop offset="1" stopColor="#F5A524"/>
          </LinearGradient>
          <LinearGradient id="g_book" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#8C74F5"/><Stop offset="1" stopColor="#5A41D4"/>
          </LinearGradient>
          <RadialGradient id="g_blush" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FF8A9E" stopOpacity="0.75"/><Stop offset="1" stopColor="#FF8A9E" stopOpacity="0"/>
          </RadialGradient>
        </Defs>
      
        {/* back hair */}
        <Path d="M60 86 C52 44 78 28 102 29 C130 29 152 48 146 90 C150 112 160 130 152 150 C148 162 156 174 142 182 L60 182 C46 174 54 162 50 150 C40 130 54 110 60 86 Z" fill="url(#g_hair)"/>
        <Path d="M56 140 C50 150 56 162 52 172" stroke="#7E4A30" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>
        <Path d="M148 132 C154 146 148 158 152 170" stroke="#7E4A30" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>
      
        {/* body */}
        <Path d="M32 230 C32 186 60 158 100 158 C140 158 168 186 168 230 Z" fill="url(#g_sweater)"/>
        <Path d="M88 130 L112 130 L113 158 C106 165 94 165 87 158 Z" fill="#E9A27C"/>
        <Path d="M83 157 C92 168 108 168 117 157" stroke="#F0A11C" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <Path d="M70 200 C72 212 70 222 72 230 M130 200 C128 212 130 222 128 230" stroke="#EFA020" strokeWidth="2" fill="none" opacity="0.6"/>
      
        {/* head */}
        <Ellipse cx="62" cy="102" rx="7" ry="9.5" fill="#F2B48E"/>
        <Ellipse cx="138" cy="102" rx="7" ry="9.5" fill="#F2B48E"/>
        <Ellipse cx="100" cy="98" rx="38.5" ry="42" fill="url(#g_skin)"/>
      
        {/* front hair: side-swept bangs */}
        <Path d="M61 96 C56 56 80 42 104 43 C128 44 145 60 140 96 C136 80 128 70 118 64 C112 76 96 86 72 90 C68 92 64 94 61 96 Z" fill="url(#g_hair)"/>
        <Path d="M118 64 C126 72 134 82 140 96" stroke="#3D2216" strokeWidth="1.5" fill="none" opacity="0.5"/>
        <Path d="M76 56 C88 46 106 44 120 50" stroke="#9A6040" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8"/>
        <Path d="M70 70 C76 62 84 58 92 56" stroke="#9A6040" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
      
        {/* face */}
        <Path d="M75 86 Q83 80 92 85" stroke="#4A2A1A" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <Path d="M108 85 Q117 80 125 86" stroke="#4A2A1A" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <Ellipse cx="84" cy="100" rx="5.6" ry="7.2" fill="#2B1A14"/>
        <Ellipse cx="116" cy="100" rx="5.6" ry="7.2" fill="#2B1A14"/>
        <Circle cx="86.2" cy="97" r="2.2" fill="#fff"/><Circle cx="82.6" cy="103" r="1" fill="#fff"/>
        <Circle cx="118.2" cy="97" r="2.2" fill="#fff"/><Circle cx="114.6" cy="103" r="1" fill="#fff"/>
        <Path d="M78.5 95 L76 93 M121.5 95 L124 93" stroke="#2B1A14" strokeWidth="1.6" strokeLinecap="round"/>
        <Path d="M99 108 Q102 112 98.5 114" stroke="#D88C66" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <Ellipse cx="73" cy="114" rx="9" ry="6" fill="url(#g_blush)"/>
        <Ellipse cx="127" cy="114" rx="9" ry="6" fill="url(#g_blush)"/>
        <Path d="M86 118 Q100 137 114 118 Q100 122 86 118 Z" fill="#9C2944"/>
        <Path d="M89 119.2 Q100 123 111 119.2 L109.5 122 Q100 125 90.5 122 Z" fill="#fff"/>
        <Ellipse cx="100" cy="128.5" rx="7" ry="3.4" fill="#FF7C8E"/>
      
        {/* waving arm (left) */}
        <Path d="M36 200 C32 182 34 164 38 146 L60 146 C60 160 62 170 72 176 C60 186 46 194 36 200 Z" fill="url(#g_sweater)"/>
        <Rect x="36" y="138" width="26" height="10" rx="5" fill="#F0A11C"/>
        <G fill="url(#g_skin)">
          <Rect x="31" y="96" width="8" height="24" rx="4" transform="rotate(-16 35 108)"/>
          <Rect x="40" y="92" width="8" height="27" rx="4" transform="rotate(-5 44 105)"/>
          <Rect x="49" y="94" width="8" height="25" rx="4" transform="rotate(6 53 106)"/>
          <Rect x="57" y="100" width="7.5" height="21" rx="3.75" transform="rotate(18 61 110)"/>
          <Ellipse cx="48" cy="126" rx="14" ry="14"/>
          <Rect x="58" y="116" width="8" height="18" rx="4" transform="rotate(48 62 125)"/>
        </G>
        <Path d="M38 132 Q48 138 58 132" stroke="#E29C76" strokeWidth="1.5" fill="none" opacity="0.7"/>
      
        {/* book + holding hand (right) */}
        <G transform="rotate(-9 140 196)">
          <Rect x="116" y="164" width="46" height="58" rx="6" fill="url(#g_book)"/>
          <Rect x="116" y="164" width="8" height="58" rx="4" fill="#4B33C2"/>
          <Rect x="158" y="168" width="5" height="50" rx="2" fill="#EEE9FF"/>
          <Rect x="132" y="178" width="20" height="4" rx="2" fill="#fff" opacity="0.8"/>
          <Rect x="132" y="186" width="14" height="3" rx="1.5" fill="#fff" opacity="0.55"/>
        </G>
        <Path d="M148 230 C150 216 148 206 144 198 L160 190 C167 204 170 218 169 230 Z" fill="url(#g_sweater)"/>
        <G fill="url(#g_skin)">
          <Rect x="128" y="196" width="22" height="8" rx="4"/>
          <Rect x="126" y="205" width="24" height="8" rx="4"/>
          <Rect x="128" y="214" width="21" height="7.5" rx="3.75"/>
        </G>
      
    </Svg>
  );
}

export function Boy({ size = 120 }) {
  return (
    <Svg width={size} height={(size * 230) / 200} viewBox="0 0 200 230">
      
        <Defs>
          <RadialGradient id="b_skin" cx="45%" cy="38%" r="70%">
            <Stop offset="0" stopColor="#FFDDC2"/><Stop offset="0.7" stopColor="#F2B68E"/><Stop offset="1" stopColor="#E29A70"/>
          </RadialGradient>
          <LinearGradient id="b_hair" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7A4A2C"/><Stop offset="1" stopColor="#4A2A18"/>
          </LinearGradient>
          <LinearGradient id="b_tee" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FF8A66"/><Stop offset="1" stopColor="#E5553A"/>
          </LinearGradient>
          <RadialGradient id="b_blush" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FF8A9E" stopOpacity="0.6"/><Stop offset="1" stopColor="#FF8A9E" stopOpacity="0"/>
          </RadialGradient>
        </Defs>
      
        {/* body */}
        <Path d="M30 230 C30 186 60 158 100 158 C140 158 170 186 170 230 Z" fill="url(#b_tee)"/>
        <Path d="M88 128 L112 128 L113 158 C106 165 94 165 87 158 Z" fill="#E09A72"/>
        <Path d="M82 157 C92 168 108 168 118 157" stroke="#D9472E" strokeWidth="6" fill="none" strokeLinecap="round"/>
      
        {/* head */}
        <Ellipse cx="62" cy="100" rx="7" ry="9.5" fill="#EDAE86"/>
        <Ellipse cx="138" cy="100" rx="7" ry="9.5" fill="#EDAE86"/>
        <Ellipse cx="100" cy="96" rx="38" ry="41" fill="url(#b_skin)"/>
      
        {/* curly hair */}
        <G fill="url(#b_hair)">
          <Path d="M62 94 C58 60 80 46 100 46 C122 46 144 60 138 94 C132 80 118 72 100 72 C84 72 70 80 62 94 Z"/>
          <Circle cx="70" cy="72" r="15"/><Circle cx="84" cy="57" r="17"/><Circle cx="104" cy="52" r="18"/>
          <Circle cx="124" cy="58" r="16"/><Circle cx="137" cy="74" r="13"/><Circle cx="62" cy="88" r="9"/><Circle cx="141" cy="88" r="8"/>
          <Circle cx="94" cy="72" r="10"/><Circle cx="114" cy="71" r="10"/>
        </G>
        <Path d="M80 50 C88 44 98 42 106 43" stroke="#A06B45" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8"/>
        <Path d="M116 48 C122 48 128 52 131 56" stroke="#A06B45" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>
      
        {/* face */}
        <Path d="M75 85 Q83 80 92 84" stroke="#4A2A18" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
        <Path d="M108 84 Q117 80 125 85" stroke="#4A2A18" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
        <Ellipse cx="84" cy="99" rx="5.4" ry="6.8" fill="#2B1A14"/>
        <Ellipse cx="116" cy="99" rx="5.4" ry="6.8" fill="#2B1A14"/>
        <Circle cx="86" cy="96.2" r="2.1" fill="#fff"/><Circle cx="82.6" cy="101.8" r="0.9" fill="#fff"/>
        <Circle cx="118" cy="96.2" r="2.1" fill="#fff"/><Circle cx="114.6" cy="101.8" r="0.9" fill="#fff"/>
        <Path d="M99 106 Q102.5 110.5 98.5 112.5" stroke="#CF8560" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <Ellipse cx="73" cy="112" rx="8.5" ry="5.5" fill="url(#b_blush)"/>
        <Ellipse cx="127" cy="112" rx="8.5" ry="5.5" fill="url(#b_blush)"/>
        <Path d="M85 116 Q100 135 115 116 Q100 120 85 116 Z" fill="#9C2944"/>
        <Path d="M88 117.2 Q100 121 112 117.2 L110.5 120 Q100 123 89.5 120 Z" fill="#fff"/>
        <Ellipse cx="100" cy="126.5" rx="6.5" ry="3.2" fill="#FF7C8E"/>
      
        {/* mug + hand (right) */}
        <Path d="M146 230 C148 214 146 202 140 194 L158 186 C166 200 170 216 170 230 Z" fill="url(#b_tee)"/>
        <Path d="M118 176 C126 170 128 164 136 160" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
        <Path d="M128 172 C134 166 134 160 142 156" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5"/>
        <Rect x="114" y="180" width="36" height="40" rx="7" fill="#FFFFFF"/>
        <Rect x="114" y="180" width="36" height="9" rx="4.5" fill="#B9774A"/>
        <Path d="M150 190 h5 a9 9 0 0 1 0 18 h-5" stroke="#FFFFFF" strokeWidth="5" fill="none"/>
        <Rect x="122" y="200" width="18" height="8" rx="4" fill="#7B61F0" opacity="0.85"/>
        <Path d="M78 230 C84 218 94 208 106 202 L110 216 C100 220 94 226 92 230 Z" fill="#E9A57D"/>
        <G fill="url(#b_skin)">
          <Rect x="104" y="192" width="20" height="8" rx="4"/>
          <Rect x="102" y="201" width="22" height="8" rx="4"/>
          <Rect x="104" y="210" width="19" height="7.5" rx="3.75"/>
        </G>
      
    </Svg>
  );
}

// Lingua globe mark (same geometry as the app icon)
export function Globe({ size = 28, color = '#fff', width = 1.5 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="9" />
        <Ellipse cx="12" cy="12" rx="3.9" ry="9" />
        <Path d="M3 12h18" />
        <Path d="M4.6 7.2c4.6 1.6 10.2 1.6 14.8 0M4.6 16.8c4.6-1.6 10.2-1.6 14.8 0" />
      </G>
    </Svg>
  );
}
