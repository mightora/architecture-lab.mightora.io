import DOMPurify from 'dompurify';
export function cleanSVG(source,purifier=DOMPurify){
 // XHTML text in foreignObject requires the HTML namespace profile, even
 // when div/span/p are explicitly allowed. Keep it safe without live media.
 return purifier.sanitize(source,{USE_PROFILES:{svg:true,svgFilters:true,html:true},ADD_TAGS:['foreignobject'],HTML_INTEGRATION_POINTS:{foreignobject:true},ADD_ATTR:['xmlns','xmlns:xlink'],FORBID_TAGS:['script','iframe','audio','video','img','object','embed','form','input','button','select','textarea','link','meta','base'],FORBID_ATTR:['onload','onclick','onerror']});
}
