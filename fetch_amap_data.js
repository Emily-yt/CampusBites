
const https = require('https');
const fs = require('fs');

const AMAP_KEY = 'a47893bfd745fe9e519f3b56607350d6';
const WUDOUKOU_LOCATION = '116.335390,39.992882';
const KEYWORDS = ['餐厅', '火锅', '烧烤', '日料', '韩餐', '西餐', '中餐', '川菜', '粤菜', '自助餐'];

let allRestaurants = [];

function fetchPoi(keyword) {
    return new Promise((resolve, reject) =&gt; {
        const url = `https://restapi.amap.com/v3/place/text?key=${AMAP_KEY}&amp;keywords=${encodeURIComponent(keyword)}&amp;location=${WUDOUKOU_LOCATION}&amp;radius=3000&amp;types=050000&amp;offset=50&amp;page=1&amp;extensions=all`;
        
        https.get(url, (res) =&gt; {
            let data = '';
            res.on('data', (chunk) =&gt; { data += chunk; });
            res.on('end', () =&gt; {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('开始获取五道口附近的餐厅数据...\n');
    
    for (const keyword of KEYWORDS) {
        try {
            console.log(`正在搜索: ${keyword}`);
            const result = await fetchPoi(keyword);
            
            if (result.status === '1' &amp;&amp; result.pois) {
                console.log(`  找到 ${result.pois.length} 个结果`);
                allRestaurants = allRestaurants.concat(result.pois);
            } else {
                console.log(`  请求失败: ${result.info || '未知错误'}`);
            }
        } catch (e) {
            console.log(`  出错: ${e.message}`);
        }
        
        await new Promise(resolve =&gt; setTimeout(resolve, 200));
    }
    
    console.log(`\n总共获取到 ${allRestaurants.length} 条数据`);
    
    // 去重
    const uniqueMap = {};
    for (const poi of allRestaurants) {
        uniqueMap[poi.id] = poi;
    }
    const uniqueRestaurants = Object.values(uniqueMap);
    console.log(`去重后: ${uniqueRestaurants.length} 条数据`);
    
    // 生成SQL
    let sqlContent = '-- ========== 五道口餐厅 ==========\n';
    
    for (const poi of uniqueRestaurants) {
        const name = (poi.name || '').replace(/'/g, "''");
        const address = (poi.address || '').replace(/'/g, "''");
        const phone = poi.tel || '';
        
        let cuisineType = '中餐';
        const typecode = poi.typecode || '';
        if (typecode.includes('050200')) cuisineType = '西餐';
        else if (typecode.includes('050300')) cuisineType = '日本料理';
        else if (typecode.includes('050400')) cuisineType = '韩国料理';
        else if (typecode.includes('050500')) cuisineType = '东南亚菜';
        else if (typecode.includes('050600')) cuisineType = '自助餐';
        else if (typecode.includes('050700')) cuisineType = '火锅';
        else if (typecode.includes('050800')) cuisineType = '烧烤';
        else if (typecode.includes('050900')) cuisineType = '小吃快餐';
        else if (typecode.includes('051000')) cuisineType = '咖啡厅';
        
        const location = (poi.location || '0,0').split(',');
        const longitude = parseFloat(location[0]) || 0;
        const latitude = parseFloat(location[1]) || 0;
        
        const bizExt = poi.biz_ext || {};
        let rating = parseFloat(bizExt.rating || '0');
        let avgPrice = parseInt(bizExt.cost || '0');
        
        const businessHours = poi.business_hours || '';
        let description = (poi.tag || '').replace(/'/g, "''");
        if (!description) description = cuisineType;
        
        const sqlLine = `('${name}', '${cuisineType}', '${description}', '${address}', '${phone}', '${businessHours}', ${avgPrice}, ${rating}, 0, 0, '海淀区', ${longitude}, ${latitude}, NOW()),`;
        sqlContent += sqlLine + '\n';
    }
    
    fs.writeFileSync('wudaokou_restaurants.sql', sqlContent, 'utf-8');
    console.log('\n数据已保存到 wudaokou_restaurants.sql');
}

main().catch(console.error);
