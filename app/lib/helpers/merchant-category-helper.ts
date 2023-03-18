import Category from '../models/domain/category'
import Receipt from '../models/domain/receipt'
import { ReceiptCategory } from '../models/enums'


const MerchantCategoryMapping = {
    'ActBlue Civics Inc': ReceiptCategory.DONATIONS,
    'Advance Auto Parts': ReceiptCategory.AUTO_REPAIR,
    'Airbnb': ReceiptCategory.TRAVEL,
    'Amazon.com': ReceiptCategory.SHOPPING,
    'Amazon Student': ReceiptCategory.SHOPPING,
    'Apple.': ReceiptCategory.SHOPPING,
    'Apple Services': ReceiptCategory.SHOPPING,
    'Best Buy': ReceiptCategory.SHOPPING,
    'Buddy': ReceiptCategory.COFFEE,
    'China Moon': ReceiptCategory.FAST_FOOD,
    'Ciao Bella Pizza and Pasta has been scheduled': ReceiptCategory.FAST_FOOD,
    'COOLER INTERNATIONAL CO': ReceiptCategory.PROJECTS,
    'Cumin': ReceiptCategory.FAST_FOOD,
    'Curious Joe': ReceiptCategory.PROJECTS,
    'Deeper Roots Coffee': ReceiptCategory.COFFEE,
    'Digital Ocean': ReceiptCategory.PROJECTS,
    'DigitalOcean': ReceiptCategory.PROJECTS,
    'DoorDash': ReceiptCategory.FAST_FOOD,
    'Drive Up': ReceiptCategory.FAST_FOOD,
    'Electronic Arts': ReceiptCategory.SHOPPING,
    'Famous Footwear': ReceiptCategory.SHOPPING,
    'Five Below': ReceiptCategory.SHOPPING,
    'Google Play': ReceiptCategory.SHOPPING,
    'GrubHub Seamless': ReceiptCategory.FAST_FOOD,
    'Instacart': ReceiptCategory.GROCERIES,
    'Lola': ReceiptCategory.COFFEE,
    'LOWE\'S HOME CENTERS': ReceiptCategory.PROJECTS,
    'Lyft': ReceiptCategory.TRANSPORTATION,
    'MAK Restaurant': ReceiptCategory.RESTAURANT,
    'mTicket': ReceiptCategory.TRANSPORTATION,
    'Oath Craft Pizza': ReceiptCategory.FAST_FOOD,
    'Panther Coffee': ReceiptCategory.COFFEE,
    'Parkmobile USA Inc': ReceiptCategory.PARKING,
    'Patreon': ReceiptCategory.DONATIONS,
    'Patriot Coffee': ReceiptCategory.COFFEE,
    'PetSmart': ReceiptCategory.PET,
    'Pressed LKLD': ReceiptCategory.COFFEE,
    'Progressive Direct Insurance': ReceiptCategory.CAR_INSURANCE,
    'Relay FM.': ReceiptCategory.DONATIONS,
    'Riot Games Inc': ReceiptCategory.GAMING,
    'Ritual': ReceiptCategory.FAST_FOOD,
    'Secretlab': ReceiptCategory.SHOPPING,
    'SunPass': ReceiptCategory.TRANSPORTATION,
    'Sweet Brew': ReceiptCategory.COFFEE,
    'Target': ReceiptCategory.GROCERIES,
    'Teespring': ReceiptCategory.SHOPPING,
    'The Economist Newspaper NA Inc': ReceiptCategory.NEWS,
    'The New York Times Co': ReceiptCategory.NEWS,
    'Tire Rack': ReceiptCategory.AUTO_MAINTENANCE,
    'TractorSupply': ReceiptCategory.PROJECTS,
    'Tractor Supply Company': ReceiptCategory.PROJECTS,
    'Uber': ReceiptCategory.TRANSPORTATION,
    'Wikimedia Foundation': ReceiptCategory.DONATIONS,
    'Wing Box': ReceiptCategory.FAST_FOOD,
}


interface MerchantCategoryHelperContext {}

class MerchantCategoryHelper {

    constructor(
        private ctx: MerchantCategoryHelperContext
    ) {}

    categorize(normalizedMerchantName: string): ReceiptCategory {
        const category = MerchantCategoryMapping[normalizedMerchantName]
        return category || ReceiptCategory.UNCATEGORIZED
    }

}

export default MerchantCategoryHelper
