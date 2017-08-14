package de.fhg.iais.roberta.syntax.action.arduino.mbot;

import java.util.List;

import de.fhg.iais.roberta.blockly.generated.Block;
import de.fhg.iais.roberta.blockly.generated.Field;
import de.fhg.iais.roberta.blockly.generated.Value;
import de.fhg.iais.roberta.syntax.BlockTypeContainer;
import de.fhg.iais.roberta.syntax.BlocklyBlockProperties;
import de.fhg.iais.roberta.syntax.BlocklyComment;
import de.fhg.iais.roberta.syntax.BlocklyConstants;
import de.fhg.iais.roberta.syntax.Phrase;
import de.fhg.iais.roberta.syntax.action.Action;
import de.fhg.iais.roberta.syntax.lang.expr.ColorConst;
import de.fhg.iais.roberta.syntax.lang.expr.Expr;
import de.fhg.iais.roberta.transformer.ExprParam;
import de.fhg.iais.roberta.transformer.Jaxb2AstTransformer;
import de.fhg.iais.roberta.transformer.JaxbTransformerHelper;
import de.fhg.iais.roberta.typecheck.BlocklyType;
import de.fhg.iais.roberta.util.dbc.Assert;
import de.fhg.iais.roberta.visitor.AstVisitor;
import de.fhg.iais.roberta.visitor.arduino.ArduinoAstVisitor;

/**
 * This class represents the <b>mbedActions_leds_on</b> blocks from Blockly into the AST (abstract syntax tree).
 * Object from this class will generate code for turning on the Led.<br/>
 * <br>
 * The client must provide the {@link ColorConst} color of the led. <br>
 * <br>
 * To create an instance from this class use the method {@link #make(ColorConst, BlocklyBlockProperties, BlocklyComment)}.<br>
 */
public class ExternalLedOnAction<V> extends Action<V> {
    private final Expr<V> ledColor;
    private final String side;
    private final String port;

    private ExternalLedOnAction(String side, String port, Expr<V> ledColor, BlocklyBlockProperties properties, BlocklyComment comment) {
        super(BlockTypeContainer.getByName("MAKEBLOCK_EXTERNAL_RGB_LED_ON"), properties, comment);
        Assert.notNull(ledColor);
        this.ledColor = ledColor;
        this.side = side;
        this.port = port;
        setReadOnly();
    }

    /**
     * Creates instance of {@link ExternalLedOnAction}. This instance is read only and can not be modified.
     *
     * @param ledColor {@link ColorConst} color of the led; must <b>not</b> be null,
     * @param properties of the block (see {@link BlocklyBlockProperties}),
     * @param comment added from the user,
     * @return read only object of class {@link ExternalLedOnAction}
     */
    private static <V> ExternalLedOnAction<V> make(String side, String port, Expr<V> ledColor, BlocklyBlockProperties properties, BlocklyComment comment) {
        return new ExternalLedOnAction<>(side, port, ledColor, properties, comment);
    }

    /**
     * @return {@link ColorConst} color of the led.
     */
    public Expr<V> getLedColor() {
        return this.ledColor;
    }

    @Override
    public String toString() {
        return "LedOnAction [ " + this.port + ", " + this.side + ", " + this.ledColor + " ]";
    }

    @Override
    protected V accept(AstVisitor<V> visitor) {
        return ((ArduinoAstVisitor<V>) visitor).visitExternalLedOnAction(this);
    }

    public String getSide() {
        return this.side;
    }

    public String getPort() {
        return this.port;
    }

    /**
     * Transformation from JAXB object to corresponding AST object.
     *
     * @param block for transformation
     * @param helper class for making the transformation
     * @return corresponding AST object
     */
    public static <V> Phrase<V> jaxbToAst(Block block, Jaxb2AstTransformer<V> helper) {
        List<Value> values = helper.extractValues(block, (short) 1);
        List<Field> fields = helper.extractFields(block, (short) 2);
        String side = helper.extractField(fields, BlocklyConstants.LEDNUMBER);
        String port = helper.extractField(fields, BlocklyConstants.SENSORPORT);
        Phrase<V> ledColor = helper.extractValue(values, new ExprParam(BlocklyConstants.COLOR, BlocklyType.COLOR));
        return ExternalLedOnAction.make(side, port, helper.convertPhraseToExpr(ledColor), helper.extractBlockProperties(block), helper.extractComment(block));

    }

    @Override
    public Block astToBlock() {
        Block jaxbDestination = new Block();
        JaxbTransformerHelper.setBasicProperties(this, jaxbDestination);
        JaxbTransformerHelper.addField(jaxbDestination, BlocklyConstants.LEDNUMBER, this.side);
        JaxbTransformerHelper.addField(jaxbDestination, BlocklyConstants.SENSORPORT, this.port);
        JaxbTransformerHelper.addValue(jaxbDestination, BlocklyConstants.COLOR, this.ledColor);
        return jaxbDestination;

    }
}
