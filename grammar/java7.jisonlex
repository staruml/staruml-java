/* Integer literals */

%lex
%options flex
DecimalIntegerLiteral           {DecimalNumeral}{IntegerTypeSuffix}?
HexIntegerLiteral               {HexNumeral}{IntegerTypeSuffix}?
OctalIntegerLiteral             {OctalNumeral}{IntegerTypeSuffix}?
BinaryIntegerLiteral            {BinaryNumeral}{IntegerTypeSuffix}?
IntegerTypeSuffix               [lL]
DecimalNumeral                  '0'| ({NonZeroDigit} ({Digits} | {Underscores} {Digits})?)
Digits                          {Digit} {DigitOrUnderscore}* {Digit}?
Digit                           [0] | {NonZeroDigit}
NonZeroDigit                    [1-9]
DigitOrUnderscore               {Digit} | [_]
Underscores                     [_]+
HexNumeral                      [0] [xX] {HexDigits}{1,16}
HexDigits                       {HexDigit} ({HexDigitOrUnderscore}* {HexDigit})?
HexDigit                        [0-9a-fA-F]
HexDigitOrUnderscore            {HexDigit} |[_]
OctalNumeral                    [0] {Underscores}? {OctalDigits}
OctalDigits                     {OctalDigit} ({OctalDigitOrUnderscore}* {OctalDigit})?
OctalDigit                      [0-7]
OctalDigitOrUnderscore          {OctalDigit} | [_]
BinaryNumeral                   [0] [bB] {BinaryDigits}?
BinaryDigits                    {BinaryDigit} ({BinaryDigitOrUnderscore}* {BinaryDigit})?
BinaryDigit                     [01]
BinaryDigitOrUnderscore         {BinaryDigit} | [_]

/* Floating point literals */

DecimalFloatingPointLiteral     ({Digits} '.' {Digits}? {ExponentPart}? {FloatTypeSuffix}? ) | ( '.' {Digits} {ExponentPart}? {FloatTypeSuffix}? ) | ( {Digits} {ExponentPart} {FloatTypeSuffix}? ) | ({Digits} {FloatTypeSuffix})
ExponentPart                    {ExponentIndicator}{SignedInteger}
ExponentIndicator               [eE]
SignedInteger                   {Sign}? {Digits}
Sign                            [+-]
FloatTypeSuffix                 [fFdD]
HexadecimalFloatingPointLiteral     {HexSignificand} {BinaryExponent} {FloatTypeSuffix}?
HexSignificand                  {HexNumeral} '.'? | ( '0' [xX] {HexDigits}? '.' {HexDigits})
BinaryExponent                  {BinaryExponentIndicator} {SignedInteger}
BinaryExponentIndicator         [pP]

/* Character Literal */

SingleCharacter                 [^'\\]
StringCharacters                {StringCharacter}+
StringCharacter                 [^"\\] | {EscapeSequence}
EscapeSequence                  ('\\' [btnfr"'\\]) | {OctalEscape} | {UnicodeEscape}
OctalEscape                     ('\\' {OctalDigit}) | ('\\' {OctalDigit} {OctalDigit})  | ('\\' {ZeroToThree} {OctalDigit} {OctalDigit})
UnicodeEscape                   '\\' 'u' {HexDigit} {HexDigit} {HexDigit} {HexDigit}
ZeroToThree                     [0-3]

/* Identifiers */

JavaLetter                      [a-zA-Z$_]|{JavaUnicodeLetter}
JavaLetterOrDigit               [a-zA-Z0-9$_]|{JavaUnicodeLetterorDigit}    
JavaIdentifier                  {JavaLetter}{JavaLetterOrDigit}*
JavaIntegerLiteral              {DecimalIntegerLiteral}|{HexIntegerLiteral}|{OctalIntegerLiteral}|{BinaryIntegerLiteral}
JavaFloatingPointLiteral        {DecimalFloatingPointLiteral}|{HexadecimalFloatingPointLiteral} 
JavaCharacterLiteral            ('\''{SingleCharacter}'\'')|('\''{EscapeSequence}'\'')
JavaStringLiteral               '"' {StringCharacters}? '"'

JavaUnicodeLetter               [\u0100-\u02c1]|[\u02c6-\u02d1]|[\u02e0-\u02e4]|\u02ec|\u02ee|[\u0370-\u0374]|[\u0376-\u0377]|[\u037a-\u037d]|\u0386|[\u0388-\u038a]|\u038c|[\u038e-\u03a1]|[\u03a3-\u03f5]|[\u03f7-\u0481]|[\u048a-\u0527]|[\u0531-\u0556]|\u0559|[\u0561-\u0587]|[\u05d0-\u05ea]|[\u05f0-\u05f2]|\u060b|[\u0620-\u064a]|[\u066e-\u066f]|[\u0671-\u06d3]|\u06d5|[\u06e5-\u06e6]|[\u06ee-\u06ef]|[\u06fa-\u06fc]|\u06ff|\u0710|[\u0712-\u072f]|[\u074d-\u07a5]|\u07b1|[\u07ca-\u07ea]|[\u07f4-\u07f5]|\u07fa|[\u0800-\u0815]|\u081a|\u0824|\u0828|[\u0840-\u0858]|[\u0904-\u0939]|\u093d|\u0950|[\u0958-\u0961]|[\u0971-\u0977]|[\u0979-\u097f]|[\u0985-\u098c]|[\u098f-\u0990]|[\u0993-\u09a8]|[\u09aa-\u09b0]|\u09b2|[\u09b6-\u09b9]|\u09bd|\u09ce|[\u09dc-\u09dd]|[\u09df-\u09e1]|[\u09f0-\u09f3]|\u09fb|[\u0a05-\u0a0a]|[\u0a0f-\u0a10]|[\u0a13-\u0a28]|[\u0a2a-\u0a30]|[\u0a32-\u0a33]|[\u0a35-\u0a36]|[\u0a38-\u0a39]|[\u0a59-\u0a5c]|\u0a5e|[\u0a72-\u0a74]|[\u0a85-\u0a8d]|[\u0a8f-\u0a91]|[\u0a93-\u0aa8]|[\u0aaa-\u0ab0]|[\u0ab2-\u0ab3]|[\u0ab5-\u0ab9]|\u0abd|\u0ad0|[\u0ae0-\u0ae1]|\u0af1|[\u0b05-\u0b0c]|[\u0b0f-\u0b10]|[\u0b13-\u0b28]|[\u0b2a-\u0b30]|[\u0b32-\u0b33]|[\u0b35-\u0b39]|\u0b3d|[\u0b5c-\u0b5d]|[\u0b5f-\u0b61]|\u0b71|\u0b83|[\u0b85-\u0b8a]|[\u0b8e-\u0b90]|[\u0b92-\u0b95]|[\u0b99-\u0b9a]|\u0b9c|[\u0b9e-\u0b9f]|[\u0ba3-\u0ba4]|[\u0ba8-\u0baa]|[\u0bae-\u0bb9]|\u0bd0|\u0bf9|[\u0c05-\u0c0c]|[\u0c0e-\u0c10]|[\u0c12-\u0c28]|[\u0c2a-\u0c33]|[\u0c35-\u0c39]|\u0c3d|[\u0c58-\u0c59]|[\u0c60-\u0c61]|[\u0c85-\u0c8c]|[\u0c8e-\u0c90]|[\u0c92-\u0ca8]|[\u0caa-\u0cb3]|[\u0cb5-\u0cb9]|\u0cbd|\u0cde|[\u0ce0-\u0ce1]|[\u0cf1-\u0cf2]|[\u0d05-\u0d0c]|[\u0d0e-\u0d10]|[\u0d12-\u0d3a]|\u0d3d|\u0d4e|[\u0d60-\u0d61]|[\u0d7a-\u0d7f]|[\u0d85-\u0d96]|[\u0d9a-\u0db1]|[\u0db3-\u0dbb]|\u0dbd|[\u0dc0-\u0dc6]|[\u0e01-\u0e30]|[\u0e32-\u0e33]|[\u0e3f-\u0e46]|[\u0e81-\u0e82]|\u0e84|[\u0e87-\u0e88]|\u0e8a|\u0e8d|[\u0e94-\u0e97]|[\u0e99-\u0e9f]|[\u0ea1-\u0ea3]|\u0ea5|\u0ea7|[\u0eaa-\u0eab]|[\u0ead-\u0eb0]|[\u0eb2-\u0eb3]|\u0ebd|[\u0ec0-\u0ec4]|\u0ec6|[\u0edc-\u0edd]|\u0f00|[\u0f40-\u0f47]|[\u0f49-\u0f6c]|[\u0f88-\u0f8c]|[\u1000-\u102a]|\u103f|[\u1050-\u1055]|[\u105a-\u105d]|\u1061|[\u1065-\u1066]|[\u106e-\u1070]|[\u1075-\u1081]|\u108e|[\u10a0-\u10c5]|[\u10d0-\u10fa]|\u10fc|[\u1100-\u1248]|[\u124a-\u124d]|[\u1250-\u1256]|\u1258|[\u125a-\u125d]|[\u1260-\u1288]|[\u128a-\u128d]|[\u1290-\u12b0]|[\u12b2-\u12b5]|[\u12b8-\u12be]|\u12c0|[\u12c2-\u12c5]|[\u12c8-\u12d6]|[\u12d8-\u1310]|[\u1312-\u1315]|[\u1318-\u135a]|[\u1380-\u138f]|[\u13a0-\u13f4]|[\u1401-\u166c]|[\u166f-\u167f]|[\u1681-\u169a]|[\u16a0-\u16ea]|[\u16ee-\u16f0]|[\u1700-\u170c]|[\u170e-\u1711]|[\u1720-\u1731]|[\u1740-\u1751]|[\u1760-\u176c]|[\u176e-\u1770]|[\u1780-\u17b3]|\u17d7|[\u17db-\u17dc]|[\u1820-\u1877]|[\u1880-\u18a8]|\u18aa|[\u18b0-\u18f5]|[\u1900-\u191c]|[\u1950-\u196d]|[\u1970-\u1974]|[\u1980-\u19ab]|[\u19c1-\u19c7]|[\u1a00-\u1a16]|[\u1a20-\u1a54]|\u1aa7|[\u1b05-\u1b33]|[\u1b45-\u1b4b]|[\u1b83-\u1ba0]|[\u1bae-\u1baf]|[\u1bc0-\u1be5]|[\u1c00-\u1c23]|[\u1c4d-\u1c4f]|[\u1c5a-\u1c7d]|[\u1ce9-\u1cec]|[\u1cee-\u1cf1]|[\u1d00-\u1dbf]|[\u1e00-\u1f15]|[\u1f18-\u1f1d]|[\u1f20-\u1f45]|[\u1f48-\u1f4d]|[\u1f50-\u1f57]|\u1f59|\u1f5b|\u1f5d|[\u1f5f-\u1f7d]|[\u1f80-\u1fb4]|[\u1fb6-\u1fbc]|\u1fbe|[\u1fc2-\u1fc4]|[\u1fc6-\u1fcc]|[\u1fd0-\u1fd3]|[\u1fd6-\u1fdb]|[\u1fe0-\u1fec]|[\u1ff2-\u1ff4]|[\u1ff6-\u1ffc]|[\u203f-\u2040]|\u2054|\u2071|\u207f|[\u2090-\u209c]|[\u20a0-\u20b9]|\u2102|\u2107|[\u210a-\u2113]|\u2115|[\u2119-\u211d]|\u2124|\u2126|\u2128|[\u212a-\u212d]|[\u212f-\u2139]|[\u213c-\u213f]|[\u2145-\u2149]|\u214e|[\u2160-\u2188]|[\u2c00-\u2c2e]|[\u2c30-\u2c5e]|[\u2c60-\u2ce4]|[\u2ceb-\u2cee]|[\u2d00-\u2d25]|[\u2d30-\u2d65]|\u2d6f|[\u2d80-\u2d96]|[\u2da0-\u2da6]|[\u2da8-\u2dae]|[\u2db0-\u2db6]|[\u2db8-\u2dbe]|[\u2dc0-\u2dc6]|[\u2dc8-\u2dce]|[\u2dd0-\u2dd6]|[\u2dd8-\u2dde]|\u2e2f|[\u3005-\u3007]|[\u3021-\u3029]|[\u3031-\u3035]|[\u3038-\u303c]|[\u3041-\u3096]|[\u309d-\u309f]|[\u30a1-\u30fa]|[\u30fc-\u30ff]|[\u3105-\u312d]|[\u3131-\u318e]|[\u31a0-\u31ba]|[\u31f0-\u31ff]|[\u3400-\u4db5]|[\u4e00-\u9fcb]|[\ua000-\ua48c]|[\ua4d0-\ua4fd]|[\ua500-\ua60c]|[\ua610-\ua61f]|[\ua62a-\ua62b]|[\ua640-\ua66e]|[\ua67f-\ua697]|[\ua6a0-\ua6ef]|[\ua717-\ua71f]|[\ua722-\ua788]|[\ua78b-\ua78e]|[\ua790-\ua791]|[\ua7a0-\ua7a9]|[\ua7fa-\ua801]|[\ua803-\ua805]|[\ua807-\ua80a]|[\ua80c-\ua822]|\ua838|[\ua840-\ua873]|[\ua882-\ua8b3]|[\ua8f2-\ua8f7]|\ua8fb|[\ua90a-\ua925]|[\ua930-\ua946]|[\ua960-\ua97c]|[\ua984-\ua9b2]|\ua9cf|[\uaa00-\uaa28]|[\uaa40-\uaa42]|[\uaa44-\uaa4b]|[\uaa60-\uaa76]|\uaa7a|[\uaa80-\uaaaf]|\uaab1|[\uaab5-\uaab6]|[\uaab9-\uaabd]|\uaac0|\uaac2|[\uaadb-\uaadd]|[\uab01-\uab06]|[\uab09-\uab0e]|[\uab11-\uab16]|[\uab20-\uab26]|[\uab28-\uab2e]|[\uabc0-\uabe2]|[\uac00-\ud7a3]|[\ud7b0-\ud7c6]|[\ud7cb-\ud7fb]|[\uf900-\ufa2d]|[\ufa30-\ufa6d]|[\ufa70-\ufad9]|[\ufb00-\ufb06]|[\ufb13-\ufb17]|\ufb1d|[\ufb1f-\ufb28]|[\ufb2a-\ufb36]|[\ufb38-\ufb3c]|\ufb3e|[\ufb40-\ufb41]|[\ufb43-\ufb44]|[\ufb46-\ufbb1]|[\ufbd3-\ufd3d]|[\ufd50-\ufd8f]|[\ufd92-\ufdc7]|[\ufdf0-\ufdfc]|[\ufe33-\ufe34]|[\ufe4d-\ufe4f]|\ufe69|[\ufe70-\ufe74]|[\ufe76-\ufefc]|\uff04|[\uff21-\uff3a]|\uff3f|[\uff41-\uff5a]|[\uff66-\uffbe]|[\uffc2-\uffc7]|[\uffca-\uffcf]|[\uffd2-\uffd7]|[\uffda-\uffdc]|[\uffe0-\uffe1]|[\uffe5-\uffe6]|\ud800[\udc00-\udc0b]|\ud800[\udc0d-\udc26]|\ud800[\udc28-\udc3a]|\ud800[\udc3c-\udc3d]|\ud800[\udc3f-\udc4d]|\ud800[\udc50-\udc5d]|\ud800[\udc80-\udcfa]|\ud800[\udd40-\udd74]|\ud800[\ude80-\ude9c]|\ud800[\udea0-\uded0]|\ud800[\udf00-\udf1e]|\ud800[\udf30-\udf4a]|\ud800[\udf80-\udf9d]|\ud800[\udfa0-\udfc3]|\ud800[\udfc8-\udfcf]|\ud800[\udfd1-\udfd5]|\ud801[\udc00-\udc9d]|\ud802[\udc00-\udc05]|\ud802\udc08|\ud802[\udc0a-\udc35]|\ud802[\udc37-\udc38]|\ud802\udc3c|\ud802[\udc3f-\udc55]|\ud802[\udd00-\udd15]|\ud802[\udd20-\udd39]|\ud802\ude00|\ud802[\ude10-\ude13]|\ud802[\ude15-\ude17]|\ud802[\ude19-\ude33]|\ud802[\ude60-\ude7c]|\ud802[\udf00-\udf35]|\ud802[\udf40-\udf55]|\ud802[\udf60-\udf72]|\ud803[\udc00-\udc48]|\ud804[\udc03-\udc37]|\ud804[\udc83-\udcaf]|\ud808[\udc00-\udf6e]|\ud809[\udc00-\udc62]|\ud80c[\udc00-\udfff]|\ud80d[\udc00-\udc2e]|\ud81a[\udc00-\ude38]|\ud82c[\udc00-\udc01]|\ud835[\udc00-\udc54]|\ud835[\udc56-\udc9c]|\ud835[\udc9e-\udc9f]|\ud835\udca2|\ud835[\udca5-\udca6]|\ud835[\udca9-\udcac]|\ud835[\udcae-\udcb9]|\ud835\udcbb|\ud835[\udcbd-\udcc3]|\ud835[\udcc5-\udd05]|\ud835[\udd07-\udd0a]|\ud835[\udd0d-\udd14]|\ud835[\udd16-\udd1c]|\ud835[\udd1e-\udd39]|\ud835[\udd3b-\udd3e]|\ud835[\udd40-\udd44]|\ud835\udd46|\ud835[\udd4a-\udd50]|\ud835[\udd52-\udea5]|\ud835[\udea8-\udec0]|\ud835[\udec2-\udeda]|\ud835[\udedc-\udefa]|\ud835[\udefc-\udf14]|\ud835[\udf16-\udf34]|\ud835[\udf36-\udf4e]|\ud835[\udf50-\udf6e]|\ud835[\udf70-\udf88]|\ud835[\udf8a-\udfa8]|\ud835[\udfaa-\udfc2]|\ud835[\udfc4-\udfcb]|\ud840[\udc00-\udfff]|\ud841[\udc00-\udfff]|\ud842[\udc00-\udfff]|\ud843[\udc00-\udfff]|\ud844[\udc00-\udfff]|\ud845[\udc00-\udfff]|\ud846[\udc00-\udfff]|\ud847[\udc00-\udfff]|\ud848[\udc00-\udfff]|\ud849[\udc00-\udfff]|\ud84a[\udc00-\udfff]|\ud84b[\udc00-\udfff]|\ud84c[\udc00-\udfff]|\ud84d[\udc00-\udfff]|\ud84e[\udc00-\udfff]|\ud84f[\udc00-\udfff]|\ud850[\udc00-\udfff]|\ud851[\udc00-\udfff]|\ud852[\udc00-\udfff]|\ud853[\udc00-\udfff]|\ud854[\udc00-\udfff]|\ud855[\udc00-\udfff]|\ud856[\udc00-\udfff]|\ud857[\udc00-\udfff]|\ud858[\udc00-\udfff]|\ud859[\udc00-\udfff]|\ud85a[\udc00-\udfff]|\ud85b[\udc00-\udfff]|\ud85c[\udc00-\udfff]|\ud85d[\udc00-\udfff]|\ud85e[\udc00-\udfff]|\ud85f[\udc00-\udfff]|\ud860[\udc00-\udfff]|\ud861[\udc00-\udfff]|\ud862[\udc00-\udfff]|\ud863[\udc00-\udfff]|\ud864[\udc00-\udfff]|\ud865[\udc00-\udfff]|\ud866[\udc00-\udfff]|\ud867[\udc00-\udfff]|\ud868[\udc00-\udfff]|\ud869[\udc00-\uded6]|\ud869[\udf00-\udfff]|\ud86a[\udc00-\udfff]|\ud86b[\udc00-\udfff]|\ud86c[\udc00-\udfff]|\ud86d[\udc00-\udf34]|\ud86d[\udf40-\udfff]|\ud86e[\udc00-\udc1d]|\ud87e[\udc00-\ude1d]
JavaUnicodeLetterorDigit        [\u0100-\u02c1]|[\u02c6-\u02d1]|[\u02e0-\u02e4]|\u02ec|\u02ee|[\u0300-\u0374]|[\u0376-\u0377]|[\u037a-\u037d]|\u0386|[\u0388-\u038a]|\u038c|[\u038e-\u03a1]|[\u03a3-\u03f5]|[\u03f7-\u0481]|[\u0483-\u0487]|[\u048a-\u0527]|[\u0531-\u0556]|\u0559|[\u0561-\u0587]|[\u0591-\u05bd]|\u05bf|[\u05c1-\u05c2]|[\u05c4-\u05c5]|\u05c7|[\u05d0-\u05ea]|[\u05f0-\u05f2]|[\u0600-\u0603]|\u060b|[\u0610-\u061a]|[\u0620-\u0669]|[\u066e-\u06d3]|[\u06d5-\u06dd]|[\u06df-\u06e8]|[\u06ea-\u06fc]|\u06ff|[\u070f-\u074a]|[\u074d-\u07b1]|[\u07c0-\u07f5]|\u07fa|[\u0800-\u082d]|[\u0840-\u085b]|[\u0900-\u0963]|[\u0966-\u096f]|[\u0971-\u0977]|[\u0979-\u097f]|[\u0981-\u0983]|[\u0985-\u098c]|[\u098f-\u0990]|[\u0993-\u09a8]|[\u09aa-\u09b0]|\u09b2|[\u09b6-\u09b9]|[\u09bc-\u09c4]|[\u09c7-\u09c8]|[\u09cb-\u09ce]|\u09d7|[\u09dc-\u09dd]|[\u09df-\u09e3]|[\u09e6-\u09f3]|\u09fb|[\u0a01-\u0a03]|[\u0a05-\u0a0a]|[\u0a0f-\u0a10]|[\u0a13-\u0a28]|[\u0a2a-\u0a30]|[\u0a32-\u0a33]|[\u0a35-\u0a36]|[\u0a38-\u0a39]|\u0a3c|[\u0a3e-\u0a42]|[\u0a47-\u0a48]|[\u0a4b-\u0a4d]|\u0a51|[\u0a59-\u0a5c]|\u0a5e|[\u0a66-\u0a75]|[\u0a81-\u0a83]|[\u0a85-\u0a8d]|[\u0a8f-\u0a91]|[\u0a93-\u0aa8]|[\u0aaa-\u0ab0]|[\u0ab2-\u0ab3]|[\u0ab5-\u0ab9]|[\u0abc-\u0ac5]|[\u0ac7-\u0ac9]|[\u0acb-\u0acd]|\u0ad0|[\u0ae0-\u0ae3]|[\u0ae6-\u0aef]|\u0af1|[\u0b01-\u0b03]|[\u0b05-\u0b0c]|[\u0b0f-\u0b10]|[\u0b13-\u0b28]|[\u0b2a-\u0b30]|[\u0b32-\u0b33]|[\u0b35-\u0b39]|[\u0b3c-\u0b44]|[\u0b47-\u0b48]|[\u0b4b-\u0b4d]|[\u0b56-\u0b57]|[\u0b5c-\u0b5d]|[\u0b5f-\u0b63]|[\u0b66-\u0b6f]|\u0b71|[\u0b82-\u0b83]|[\u0b85-\u0b8a]|[\u0b8e-\u0b90]|[\u0b92-\u0b95]|[\u0b99-\u0b9a]|\u0b9c|[\u0b9e-\u0b9f]|[\u0ba3-\u0ba4]|[\u0ba8-\u0baa]|[\u0bae-\u0bb9]|[\u0bbe-\u0bc2]|[\u0bc6-\u0bc8]|[\u0bca-\u0bcd]|\u0bd0|\u0bd7|[\u0be6-\u0bef]|\u0bf9|[\u0c01-\u0c03]|[\u0c05-\u0c0c]|[\u0c0e-\u0c10]|[\u0c12-\u0c28]|[\u0c2a-\u0c33]|[\u0c35-\u0c39]|[\u0c3d-\u0c44]|[\u0c46-\u0c48]|[\u0c4a-\u0c4d]|[\u0c55-\u0c56]|[\u0c58-\u0c59]|[\u0c60-\u0c63]|[\u0c66-\u0c6f]|[\u0c82-\u0c83]|[\u0c85-\u0c8c]|[\u0c8e-\u0c90]|[\u0c92-\u0ca8]|[\u0caa-\u0cb3]|[\u0cb5-\u0cb9]|[\u0cbc-\u0cc4]|[\u0cc6-\u0cc8]|[\u0cca-\u0ccd]|[\u0cd5-\u0cd6]|\u0cde|[\u0ce0-\u0ce3]|[\u0ce6-\u0cef]|[\u0cf1-\u0cf2]|[\u0d02-\u0d03]|[\u0d05-\u0d0c]|[\u0d0e-\u0d10]|[\u0d12-\u0d3a]|[\u0d3d-\u0d44]|[\u0d46-\u0d48]|[\u0d4a-\u0d4e]|\u0d57|[\u0d60-\u0d63]|[\u0d66-\u0d6f]|[\u0d7a-\u0d7f]|[\u0d82-\u0d83]|[\u0d85-\u0d96]|[\u0d9a-\u0db1]|[\u0db3-\u0dbb]|\u0dbd|[\u0dc0-\u0dc6]|\u0dca|[\u0dcf-\u0dd4]|\u0dd6|[\u0dd8-\u0ddf]|[\u0df2-\u0df3]|[\u0e01-\u0e3a]|[\u0e3f-\u0e4e]|[\u0e50-\u0e59]|[\u0e81-\u0e82]|\u0e84|[\u0e87-\u0e88]|\u0e8a|\u0e8d|[\u0e94-\u0e97]|[\u0e99-\u0e9f]|[\u0ea1-\u0ea3]|\u0ea5|\u0ea7|[\u0eaa-\u0eab]|[\u0ead-\u0eb9]|[\u0ebb-\u0ebd]|[\u0ec0-\u0ec4]|\u0ec6|[\u0ec8-\u0ecd]|[\u0ed0-\u0ed9]|[\u0edc-\u0edd]|\u0f00|[\u0f18-\u0f19]|[\u0f20-\u0f29]|\u0f35|\u0f37|\u0f39|[\u0f3e-\u0f47]|[\u0f49-\u0f6c]|[\u0f71-\u0f84]|[\u0f86-\u0f97]|[\u0f99-\u0fbc]|\u0fc6|[\u1000-\u1049]|[\u1050-\u109d]|[\u10a0-\u10c5]|[\u10d0-\u10fa]|\u10fc|[\u1100-\u1248]|[\u124a-\u124d]|[\u1250-\u1256]|\u1258|[\u125a-\u125d]|[\u1260-\u1288]|[\u128a-\u128d]|[\u1290-\u12b0]|[\u12b2-\u12b5]|[\u12b8-\u12be]|\u12c0|[\u12c2-\u12c5]|[\u12c8-\u12d6]|[\u12d8-\u1310]|[\u1312-\u1315]|[\u1318-\u135a]|[\u135d-\u135f]|[\u1380-\u138f]|[\u13a0-\u13f4]|[\u1401-\u166c]|[\u166f-\u167f]|[\u1681-\u169a]|[\u16a0-\u16ea]|[\u16ee-\u16f0]|[\u1700-\u170c]|[\u170e-\u1714]|[\u1720-\u1734]|[\u1740-\u1753]|[\u1760-\u176c]|[\u176e-\u1770]|[\u1772-\u1773]|[\u1780-\u17d3]|\u17d7|[\u17db-\u17dd]|[\u17e0-\u17e9]|[\u180b-\u180d]|[\u1810-\u1819]|[\u1820-\u1877]|[\u1880-\u18aa]|[\u18b0-\u18f5]|[\u1900-\u191c]|[\u1920-\u192b]|[\u1930-\u193b]|[\u1946-\u196d]|[\u1970-\u1974]|[\u1980-\u19ab]|[\u19b0-\u19c9]|[\u19d0-\u19d9]|[\u1a00-\u1a1b]|[\u1a20-\u1a5e]|[\u1a60-\u1a7c]|[\u1a7f-\u1a89]|[\u1a90-\u1a99]|\u1aa7|[\u1b00-\u1b4b]|[\u1b50-\u1b59]|[\u1b6b-\u1b73]|[\u1b80-\u1baa]|[\u1bae-\u1bb9]|[\u1bc0-\u1bf3]|[\u1c00-\u1c37]|[\u1c40-\u1c49]|[\u1c4d-\u1c7d]|[\u1cd0-\u1cd2]|[\u1cd4-\u1cf2]|[\u1d00-\u1de6]|[\u1dfc-\u1f15]|[\u1f18-\u1f1d]|[\u1f20-\u1f45]|[\u1f48-\u1f4d]|[\u1f50-\u1f57]|\u1f59|\u1f5b|\u1f5d|[\u1f5f-\u1f7d]|[\u1f80-\u1fb4]|[\u1fb6-\u1fbc]|\u1fbe|[\u1fc2-\u1fc4]|[\u1fc6-\u1fcc]|[\u1fd0-\u1fd3]|[\u1fd6-\u1fdb]|[\u1fe0-\u1fec]|[\u1ff2-\u1ff4]|[\u1ff6-\u1ffc]|[\u200b-\u200f]|[\u202a-\u202e]|[\u203f-\u2040]|\u2054|[\u2060-\u2064]|[\u206a-\u206f]|\u2071|\u207f|[\u2090-\u209c]|[\u20a0-\u20b9]|[\u20d0-\u20dc]|\u20e1|[\u20e5-\u20f0]|\u2102|\u2107|[\u210a-\u2113]|\u2115|[\u2119-\u211d]|\u2124|\u2126|\u2128|[\u212a-\u212d]|[\u212f-\u2139]|[\u213c-\u213f]|[\u2145-\u2149]|\u214e|[\u2160-\u2188]|[\u2c00-\u2c2e]|[\u2c30-\u2c5e]|[\u2c60-\u2ce4]|[\u2ceb-\u2cf1]|[\u2d00-\u2d25]|[\u2d30-\u2d65]|\u2d6f|[\u2d7f-\u2d96]|[\u2da0-\u2da6]|[\u2da8-\u2dae]|[\u2db0-\u2db6]|[\u2db8-\u2dbe]|[\u2dc0-\u2dc6]|[\u2dc8-\u2dce]|[\u2dd0-\u2dd6]|[\u2dd8-\u2dde]|[\u2de0-\u2dff]|\u2e2f|[\u3005-\u3007]|[\u3021-\u302f]|[\u3031-\u3035]|[\u3038-\u303c]|[\u3041-\u3096]|[\u3099-\u309a]|[\u309d-\u309f]|[\u30a1-\u30fa]|[\u30fc-\u30ff]|[\u3105-\u312d]|[\u3131-\u318e]|[\u31a0-\u31ba]|[\u31f0-\u31ff]|[\u3400-\u4db5]|[\u4e00-\u9fcb]|[\ua000-\ua48c]|[\ua4d0-\ua4fd]|[\ua500-\ua60c]|[\ua610-\ua62b]|[\ua640-\ua66f]|[\ua67c-\ua67d]|[\ua67f-\ua697]|[\ua6a0-\ua6f1]|[\ua717-\ua71f]|[\ua722-\ua788]|[\ua78b-\ua78e]|[\ua790-\ua791]|[\ua7a0-\ua7a9]|[\ua7fa-\ua827]|\ua838|[\ua840-\ua873]|[\ua880-\ua8c4]|[\ua8d0-\ua8d9]|[\ua8e0-\ua8f7]|\ua8fb|[\ua900-\ua92d]|[\ua930-\ua953]|[\ua960-\ua97c]|[\ua980-\ua9c0]|[\ua9cf-\ua9d9]|[\uaa00-\uaa36]|[\uaa40-\uaa4d]|[\uaa50-\uaa59]|[\uaa60-\uaa76]|[\uaa7a-\uaa7b]|[\uaa80-\uaac2]|[\uaadb-\uaadd]|[\uab01-\uab06]|[\uab09-\uab0e]|[\uab11-\uab16]|[\uab20-\uab26]|[\uab28-\uab2e]|[\uabc0-\uabea]|[\uabec-\uabed]|[\uabf0-\uabf9]|[\uac00-\ud7a3]|[\ud7b0-\ud7c6]|[\ud7cb-\ud7fb]|[\uf900-\ufa2d]|[\ufa30-\ufa6d]|[\ufa70-\ufad9]|[\ufb00-\ufb06]|[\ufb13-\ufb17]|[\ufb1d-\ufb28]|[\ufb2a-\ufb36]|[\ufb38-\ufb3c]|\ufb3e|[\ufb40-\ufb41]|[\ufb43-\ufb44]|[\ufb46-\ufbb1]|[\ufbd3-\ufd3d]|[\ufd50-\ufd8f]|[\ufd92-\ufdc7]|[\ufdf0-\ufdfc]|[\ufe00-\ufe0f]|[\ufe20-\ufe26]|[\ufe33-\ufe34]|[\ufe4d-\ufe4f]|\ufe69|[\ufe70-\ufe74]|[\ufe76-\ufefc]|\ufeff|\uff04|[\uff10-\uff19]|[\uff21-\uff3a]|\uff3f|[\uff41-\uff5a]|[\uff66-\uffbe]|[\uffc2-\uffc7]|[\uffca-\uffcf]|[\uffd2-\uffd7]|[\uffda-\uffdc]|[\uffe0-\uffe1]|[\uffe5-\uffe6]|[\ufff9-\ufffb]|\ud800[\udc00-\udc0b]|\ud800[\udc0d-\udc26]|\ud800[\udc28-\udc3a]|\ud800[\udc3c-\udc3d]|\ud800[\udc3f-\udc4d]|\ud800[\udc50-\udc5d]|\ud800[\udc80-\udcfa]|\ud800[\udd40-\udd74]|\ud800\uddfd|\ud800[\ude80-\ude9c]|\ud800[\udea0-\uded0]|\ud800[\udf00-\udf1e]|\ud800[\udf30-\udf4a]|\ud800[\udf80-\udf9d]|\ud800[\udfa0-\udfc3]|\ud800[\udfc8-\udfcf]|\ud800[\udfd1-\udfd5]|\ud801[\udc00-\udc9d]|\ud801[\udca0-\udca9]|\ud802[\udc00-\udc05]|\ud802\udc08|\ud802[\udc0a-\udc35]|\ud802[\udc37-\udc38]|\ud802\udc3c|\ud802[\udc3f-\udc55]|\ud802[\udd00-\udd15]|\ud802[\udd20-\udd39]|\ud802[\ude00-\ude03]|\ud802[\ude05-\ude06]|\ud802[\ude0c-\ude13]|\ud802[\ude15-\ude17]|\ud802[\ude19-\ude33]|\ud802[\ude38-\ude3a]|\ud802\ude3f|\ud802[\ude60-\ude7c]|\ud802[\udf00-\udf35]|\ud802[\udf40-\udf55]|\ud802[\udf60-\udf72]|\ud803[\udc00-\udc48]|\ud804[\udc00-\udc46]|\ud804[\udc66-\udc6f]|\ud804[\udc80-\udcba]|\ud804\udcbd|\ud808[\udc00-\udf6e]|\ud809[\udc00-\udc62]|\ud80c[\udc00-\udfff]|\ud80d[\udc00-\udc2e]|\ud81a[\udc00-\ude38]|\ud82c[\udc00-\udc01]|\ud834[\udd65-\udd69]|\ud834[\udd6d-\udd82]|\ud834[\udd85-\udd8b]|\ud834[\uddaa-\uddad]|\ud834[\ude42-\ude44]|\ud835[\udc00-\udc54]|\ud835[\udc56-\udc9c]|\ud835[\udc9e-\udc9f]|\ud835\udca2|\ud835[\udca5-\udca6]|\ud835[\udca9-\udcac]|\ud835[\udcae-\udcb9]|\ud835\udcbb|\ud835[\udcbd-\udcc3]|\ud835[\udcc5-\udd05]|\ud835[\udd07-\udd0a]|\ud835[\udd0d-\udd14]|\ud835[\udd16-\udd1c]|\ud835[\udd1e-\udd39]|\ud835[\udd3b-\udd3e]|\ud835[\udd40-\udd44]|\ud835\udd46|\ud835[\udd4a-\udd50]|\ud835[\udd52-\udea5]|\ud835[\udea8-\udec0]|\ud835[\udec2-\udeda]|\ud835[\udedc-\udefa]|\ud835[\udefc-\udf14]|\ud835[\udf16-\udf34]|\ud835[\udf36-\udf4e]|\ud835[\udf50-\udf6e]|\ud835[\udf70-\udf88]|\ud835[\udf8a-\udfa8]|\ud835[\udfaa-\udfc2]|\ud835[\udfc4-\udfcb]|\ud835[\udfce-\udfff]|\ud840[\udc00-\udfff]|\ud841[\udc00-\udfff]|\ud842[\udc00-\udfff]|\ud843[\udc00-\udfff]|\ud844[\udc00-\udfff]|\ud845[\udc00-\udfff]|\ud846[\udc00-\udfff]|\ud847[\udc00-\udfff]|\ud848[\udc00-\udfff]|\ud849[\udc00-\udfff]|\ud84a[\udc00-\udfff]|\ud84b[\udc00-\udfff]|\ud84c[\udc00-\udfff]|\ud84d[\udc00-\udfff]|\ud84e[\udc00-\udfff]|\ud84f[\udc00-\udfff]|\ud850[\udc00-\udfff]|\ud851[\udc00-\udfff]|\ud852[\udc00-\udfff]|\ud853[\udc00-\udfff]|\ud854[\udc00-\udfff]|\ud855[\udc00-\udfff]|\ud856[\udc00-\udfff]|\ud857[\udc00-\udfff]|\ud858[\udc00-\udfff]|\ud859[\udc00-\udfff]|\ud85a[\udc00-\udfff]|\ud85b[\udc00-\udfff]|\ud85c[\udc00-\udfff]|\ud85d[\udc00-\udfff]|\ud85e[\udc00-\udfff]|\ud85f[\udc00-\udfff]|\ud860[\udc00-\udfff]|\ud861[\udc00-\udfff]|\ud862[\udc00-\udfff]|\ud863[\udc00-\udfff]|\ud864[\udc00-\udfff]|\ud865[\udc00-\udfff]|\ud866[\udc00-\udfff]|\ud867[\udc00-\udfff]|\ud868[\udc00-\udfff]|\ud869[\udc00-\uded6]|\ud869[\udf00-\udfff]|\ud86a[\udc00-\udfff]|\ud86b[\udc00-\udfff]|\ud86c[\udc00-\udfff]|\ud86d[\udc00-\udf34]|\ud86d[\udf40-\udfff]|\ud86e[\udc00-\udc1d]|\ud87e[\udc00-\ude1d]|\udb40\udc01|\udb40[\udc20-\udc7f]|\udb40[\udd00-\uddef]

CommentEnd                      "*/"
CommentEnd1                     [\*][^/]+
CommentEnd2                     [/][^*]*
CommentBody                     {CommentEnd1}|{CommentEnd2}|{NotSlashAsterix}
NotAsterix                      [^*]
Comment                         [/][\*]({NotCommentEnd}\n|\t])*[\*][/]

Template                        [<][^=\(\);\|\+\-\"\'\{\*\\}:]+[>]+

%s                              comment
%%

\s+                             /* skip whitespace */
[/]{2}.*                        /* skip comments */


((("/*")))                      %{ this.begin('comment'); %}

<comment>[^\*]+                 %{
                                    if (yy.__currentComment) {
                                        yy.__currentComment += "\n" + yytext.trim();
                                    } else {
                                        yy.__currentComment = yytext.trim();
                                    }
                                %}
<comment>[\"]                   /* skip */                  
<comment>[=]                    /* skip */
<comment>[\*][=\"']*            %{
                                    var currentChar = yytext;                                    
                                    // console.log("currentChar" + currentChar);
                                    if(currentChar === '*') {
                                        var nxtChar = this._input[0]; // peek into next char without altering lexer's position
                                        //console.log("* match :"+yytext)
                                        //console.log("* match, nxt char:"+nxtChar)
                                        if(nxtChar === '/')
                                        {
                                            //console.log("inside popBlock"+nxtChar);
                                            nxtChar = this.input();
                                            if(nxtChar.length > 1)
                                            this.unput(2,nxtChar.length);
                                            //console.log("popped state");
                                            //console.log(this.showPosition());
                                            this.popState();
                                        }
                                    }
                                %}

/* Character Literals */

{JavaCharacterLiteral}          return 'CharacterLiteral';

{JavaStringLiteral}             return 'StringLiteral';

(("<<"))                        return 'LSHIFT';

{Template}                      %{
                                    var r = yytext;
                                    var forTest3 = "";
                                    /* 
                                     * test 1: check if it is template declaration or LT operator
                                     * test 3: check for && operator. if found, its not a template
                                     * test 2: balanced < and > symbols
                                    */
                                    var test1=false,test2=false,test3=false, skipTest3= false;
                                    for(var i=1; i<r.length; i++) {
                                        if((r[i] === ' ')||(r[i]==='\t')||(r[i]==='\n'))
                                            continue; 
                                        else {
                                            if(r[i]==='<') {
                                                //console.log(this.showPosition());
                                                //this.parseError("Invalid bitshift/template expression. Try grouping with parantheses",{text:yytext,token:'',line:yylineno})
                                                test1 = false;
                                                this.unput(r.substring(2,r.length));
                                                return 'LSHIFT';
                                                break;
                                            } else {
                                                test1 = true;
                                                break;
                                            }
                                        }
                                    }
                                    /* Start Test 2 */
                                    r = yytext;
                                    var balance = 1;
                                    var splitPos = -1;
                                    for(var i=1; i<r.length; i++) {
                                        if(r[i] === '<')
                                            balance = balance+1;
                                        if(r[i] === '>')
                                            balance = balance-1;
                                        if(balance === 0) {
                                            splitPos = i;
                                            break;
                                        }
                                    }
                                    if(balance === 0) {
                                        if(splitPos === (r.length-1)) {
                                            test2 = true;
                                            forTest3 = r;
                                        }
                                        else {
                                            if(r[splitPos+1]=='>') { /* >> left shift operator */
                                                /* test case /openjdk/hotspot/test/compiler/6711117/Test.java:76 */
                                                test2 = false;
                                                this.unput(r.substring(1,r.length));
                                                return 'LT';
                                            } else {
                                                forTest3 = r.substring(0,splitPos+1);
                                                //console.log("inside test2: "+yytext);
                                                //console.log("test2 unput: "+r.substring(splitPos+1,r.length));
                                                this.unput(r.substring(splitPos+1,r.length))
                                                test2 = true;
                                            }
                                        }
                                    }
                                    else {
                                        test2 = false;
                                        this.unput(r.substring(1,r.length));
                                        return 'LT';
                                    }
                                    /* Start Test 3 */
                                    //console.log("test3 start"+forTest3);
                                    if(forTest3.search("&&") === -1) {
                                        test3 = true;
                                    }
                                    else
                                    {
                                        test3 = false;
                                        //console.log("inside test3: "+forTest3);
                                        this.unput(forTest3.substring(1,forTest3.length));
                                        return 'LT';
                                    }
                                    if(test1 && test2 && test3) {
                                        yytext = forTest3;
                                        return 'TEMPLATE'; 
                                    }
                                %}/*            */

/* Keywords */
"abstract"                      return 'ABSTRACT';
"assert"                        return 'ASSERT';
"boolean"                       return 'BOOLEAN';
"break"                         return 'BREAK';
"byte"                          return 'BYTE';
"case"                          return 'CASE';
"catch"                         return 'CATCH';
"char"                          return 'CHAR';
"class"                         return 'CLASS';
"const"                         return 'CONST';
"continue"                      return 'CONTINUE';
"default"                       return 'DEFAULT';
"do"                            return 'DO';
"double"                        return 'DOUBLE';
"else"                          return 'ELSE';
"enum"                          return 'ENUM';
"extends"                       return 'EXTENDS';
"final"                         return 'FINAL';
"finally"                       return 'FINALLY';
"float"                         return 'FLOAT';
"for"                           return 'FOR';
"if"                            return 'IF';
"goto"                          return 'GOTO';
"implements"                    return 'IMPLEMENTS';
"import"                        return 'IMPORT';
"instanceof"                    return 'INSTANCEOF';
"int"                           return 'INT';
"interface"                     return 'INTERFACE';
"long"                          return 'LONG';
"native"                        return 'NATIVE';
"new"                           return 'NEW';
"package"                       return 'PACKAGE';
"private"                       return 'PRIVATE';
"protected"                     return 'PROTECTED';
"public"                        return 'PUBLIC';
"return"                        return 'RETURN';
"short"                         return 'SHORT';
"static"                        return 'STATIC';
"strictfp"                      return 'STRICTFP';
"super"                         return 'SUPER';
"switch"                        return 'SWITCH';
"synchronized"                  return 'SYNCHRONIZED';
"this"                          return 'THIS';
"throw"                         return 'THROW';
"throws"                        return 'THROWS';
"transient"                     return 'TRANSIENT';
"try"                           return 'TRY';
"void"                          return 'VOID';
"volatile"                      return 'VOLATILE';
"while"                         return 'WHILE';

/* Integer Literals */
{DecimalIntegerLiteral}         return 'IntegerLiteral';
{OctalIntegerLiteral}           return 'IntegerLiteral';
{HexIntegerLiteral}             return 'IntegerLiteral';

/* Floating-point Literals */
{JavaFloatingPointLiteral}      return 'FloatingPointLiteral';

/* Boolean Literals */
"true"|"false"                  return 'BooleanLiteral';

/* Null literal */

"null"                          return 'NullLiteral';

/* Separators */

"("                             return 'LPAREN';
")"                             return 'RPAREN';
"{"                             return 'LBRACE';
"}"                             return 'RBRACE';
"["                             return 'LBRACK';
"]"                             return 'RBRACK';
";"                             return 'SEMI';
","                             return 'COMMA';
"."                             return 'DOT';

/* Operators */

"="                             return 'ASSIGN';
">"                             return 'GT';
"<"                             return 'LT';
"!"                             return 'BANG';
"~"                             return 'TILDE';
"?"                             return 'QUESTION';
":"                             return 'COLON';
"=="                            return 'EQUAL';
"<="                            return 'LE';
">="                            return 'GE';
"!="                            return 'NOTEQUAL';
"&&"                            return 'AND';
"||"                            return 'OR';
"++"                            return 'INC';
"--"                            return 'DEC';
"+"                             return 'ADD';
"-"                             return 'SUB';
"*"                             return 'MUL';
"/"                             return 'DIV';
"&"                             return 'BITAND';
"|"                             return 'BITOR';
"^"                             return 'CARET';
"%"                             return 'MOD';

"+="                            return 'ADD_ASSIGN';
"-="                            return 'SUB_ASSIGN';
"*="                            return 'MUL_ASSIGN';
"/="                            return 'DIV_ASSIGN';
"&="                            return 'AND_ASSIGN';
"|="                            return 'OR_ASSIGN';
"^="                            return 'XOR_ASSIGN';
"%="                            return 'MOD_ASSIGN';
"<<="                           return 'LSHIFT_ASSIGN';
">>="                           return 'RSHIFT_ASSIGN';
">>>="                          return 'URSHIFT_ASSIGN';

/* Additional Symbols */

"@"                             return 'AT';
"..."                           return 'ELLIPSIS';

/* Identifier */
{JavaIdentifier}                %{
                                    // console.log(yytext);
                                    // console.log(this);
                                    // console.log(yylineno);
                                    // console.log(yylloc);
                                    return 'Identifier';
                                %}
                                

<<EOF>>                         return 'EOF';
