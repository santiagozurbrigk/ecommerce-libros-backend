#!/usr/bin/env node

/**
 * Script de Migración de Categorías
 * 
 * Este script migra las categorías existentes de:
 * - 'medicina' -> 'escolares'
 * - 'otros' -> 'ingles'
 * 
 * Ejecutar: node migrate-categories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function migrateCategories() {
  try {
    console.log('🔄 Iniciando migración de categorías...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Migrar productos de 'medicina' a 'escolares'
    const medicinaResult = await Product.updateMany(
      { category: 'medicina' },
      { $set: { category: 'escolares' } }
    );
    console.log(`✅ Migrados ${medicinaResult.modifiedCount} productos de 'medicina' a 'escolares'`);
    
    // Migrar productos de 'otros' a 'ingles'
    const otrosResult = await Product.updateMany(
      { category: 'otros' },
      { $set: { category: 'ingles' } }
    );
    console.log(`✅ Migrados ${otrosResult.modifiedCount} productos de 'otros' a 'ingles'`);
    
    // Verificar resultados
    const totalProducts = await Product.countDocuments();
    const escolaresCount = await Product.countDocuments({ category: 'escolares' });
    const inglesCount = await Product.countDocuments({ category: 'ingles' });
    
    console.log('\n📊 Resumen de la migración:');
    console.log(`📚 Total de productos: ${totalProducts}`);
    console.log(`🎒 Productos escolares: ${escolaresCount}`);
    console.log(`🇺🇸 Productos de inglés: ${inglesCount}`);
    
    // Verificar que no quedan categorías antiguas
    const oldCategories = await Product.find({
      category: { $in: ['medicina', 'otros'] }
    });
    
    if (oldCategories.length > 0) {
      console.log('⚠️  ADVERTENCIA: Aún quedan productos con categorías antiguas:');
      oldCategories.forEach(product => {
        console.log(`  - ${product.name} (categoría: ${product.category})`);
      });
    } else {
      console.log('✅ Todas las categorías han sido migradas correctamente');
    }
    
    console.log('\n🎉 Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateCategories()
    .then(() => {
      console.log('✅ Script de migración finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script de migración:', error);
      process.exit(1);
    });
}

module.exports = { migrateCategories }; 