<?php
declare(strict_types=1);

namespace WineNow\SEO\Block;

use Magento\Catalog\Block\Product\View;
use Magento\Catalog\Model\Product;
use Magento\Framework\View\Element\Template;
use WineNow\SEO\Helper\SchemaMarkup;

class ProductSchema extends Template
{
    protected SchemaMarkup $schemaHelper;
    protected Product $product;

    public function __construct(
        Template\Context $context,
        SchemaMarkup $schemaHelper,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->schemaHelper = $schemaHelper;
    }

    public function getProduct(): ?Product
    {
        if (!$this->product) {
            // Try to get from parent block (product view block)
            $parentBlock = $this->getParentBlock();
            if ($parentBlock && $parentBlock instanceof View) {
                $this->product = $parentBlock->getProduct();
            }
        }

        return $this->product ?? null;
    }

    public function getSchema(): ?string
    {
        $product = $this->getProduct();
        if (!$product || !$product->getId()) {
            return null;
        }

        return $this->schemaHelper->generateProductSchema($product);
    }

    public function getTemplate(): string
    {
        return 'WineNow_SEO::product_schema.phtml';
    }
}
